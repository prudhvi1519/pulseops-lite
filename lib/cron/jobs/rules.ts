import { sql } from '@/lib/db';

export async function runRulesEvaluationJob() {
    // 2. Fetch Enabled Rules
    const rulesRes = await sql`
        SELECT id, org_id, service_id, environment_id, type, params_json, name, severity, cooldown_seconds
        FROM alert_rules 
        WHERE enabled = true
    `;
    const rules = rulesRes.rows;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const triggeredRules: any[] = [];
    let incidentsCreated = 0;
    let incidentsUpdated = 0;

    // 3. Evaluate Rules
    for (const rule of rules) {
        const { id: ruleId, type, params_json, org_id, service_id, environment_id, name, severity, cooldown_seconds } = rule;
        let triggered = false;
        let context: any = {}; // eslint-disable-line @typescript-eslint/no-explicit-any
        let fingerprint = '';

        if (type === 'error_count') {
            const windowMinutes = params_json.windowMinutes || 5;
            const threshold = params_json.threshold || 10;

            const conditions = [`org_id = $1`, `level = 'error'`, `ts >= NOW() - make_interval(mins => $2)`];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const params: any[] = [org_id, windowMinutes];
            let pIndex = 3;

            if (service_id) { conditions.push(`service_id = $${pIndex++}`); params.push(service_id); }
            if (environment_id) { conditions.push(`environment_id = $${pIndex++}`); params.push(environment_id); }

            const countRes = await sql.query(
                `SELECT count(*) as count FROM logs WHERE ${conditions.join(' AND ')}`,
                params
            );
            const count = parseInt(countRes.rows[0].count);

            if (count >= threshold) {
                triggered = true;
                context = { count, threshold, windowMinutes };
                fingerprint = `error_count:${service_id || 'all'}:${environment_id || 'all'}:${windowMinutes}:${threshold}`;
            }

        } else if (type === 'deployment_failure') {
            const conditions = [`org_id = $1`];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const params: any[] = [org_id];
            let pIndex = 2;

            if (service_id) { conditions.push(`service_id = $${pIndex++}`); params.push(service_id); }
            if (environment_id) { conditions.push(`environment_id = $${pIndex++}`); params.push(environment_id); }

            const deployRes = await sql.query(
                `SELECT status, id, created_at FROM deployments WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC LIMIT 1`,
                params
            );

            if (deployRes.rows.length > 0) {
                const deploy = deployRes.rows[0];
                if (['failure', 'timed_out', 'cancelled'].includes(deploy.status)) {
                    triggered = true;
                    context = { deploymentId: deploy.id, status: deploy.status };
                    fingerprint = `deployment_failure:${service_id || 'all'}:${environment_id || 'all'}:${deploy.id}`;
                }
            }
        }

        if (triggered) {
            // 4. Upsert Firing State
            const firingRes = await sql`
                INSERT INTO alert_firings (rule_id, fired_at, fingerprint)
                VALUES (${ruleId}, NOW(), ${fingerprint})
                ON CONFLICT (rule_id, fingerprint) 
                DO UPDATE SET fired_at = NOW()
                RETURNING last_notified_at
            `;
            const lastNotifiedAt = firingRes.rows[0].last_notified_at ? new Date(firingRes.rows[0].last_notified_at) : null;

            // 5. Dedupe Incident
            const incidentCheck = await sql`
                SELECT id FROM incidents 
                WHERE org_id = ${org_id} 
                  AND rule_id = ${ruleId} 
                  AND fingerprint = ${fingerprint}
                  AND status IN ('open', 'investigating')
            `;

            if (incidentCheck.rows.length > 0) {
                // Ongoing Incident -> Add Event
                const incidentId = incidentCheck.rows[0].id;
                await sql`
                    INSERT INTO incident_events (incident_id, type, message, meta_json)
                    VALUES (${incidentId}, 'trigger', ${`Alert condition re-detected: ${JSON.stringify(context)}`}, ${JSON.stringify(context)})
                `;
                incidentsUpdated++;

                const channels = await sql`SELECT type, config_json FROM notification_channels WHERE org_id = ${org_id} AND enabled = true`;
                for (const channel of channels.rows) {
                    await sql`
                        INSERT INTO notification_jobs (org_id, type, payload_json, status, attempts)
                        VALUES (
                            ${org_id}, 
                            ${channel.type}, 
                            ${JSON.stringify({
                        webhookUrl: channel.config_json.webhookUrl,
                        event: 'incident.updated',
                        incidentId: incidentCheck.rows[0].id,
                        title: `[UPDATE] ${name}`,
                        status: 'investigating',
                        context: JSON.stringify(context),
                        link: `http://localhost:3000/incidents/${incidentCheck.rows[0].id}`
                    })}::jsonb, 
                            'pending', 
                            0
                        )
                    `;
                }
            } else {
                // No Open Incident -> Check Cooldown
                const now = new Date();
                const shouldNotify = !lastNotifiedAt || (now.getTime() - lastNotifiedAt.getTime() > cooldown_seconds * 1000);

                if (shouldNotify) {
                    // Create Incident
                    const incidentRes = await sql`
                        INSERT INTO incidents (
                            org_id, service_id, environment_id, 
                            title, description, severity, status, source, rule_id, fingerprint
                        )
                        VALUES (
                            ${org_id}, ${service_id || null}, ${environment_id || null},
                            ${`Alert: ${name}`}, ${`Triggered by rule ${name}. Context: ${JSON.stringify(context)}`},
                            ${severity}, 'open', 'alert', ${ruleId}, ${fingerprint}
                        )
                        RETURNING id
                    `;
                    const newIncidentId = incidentRes.rows[0].id;

                    await sql`
                        INSERT INTO incident_events (incident_id, type, message, meta_json)
                        VALUES (${newIncidentId}, 'created', ${`Incident created by alert rule "${name}"`}, ${JSON.stringify(context)})
                    `;

                    await sql`
                        UPDATE alert_firings 
                        SET last_notified_at = NOW() 
                        WHERE rule_id = ${ruleId} AND fingerprint = ${fingerprint}
                    `;
                    incidentsCreated++;

                    const channels = await sql`SELECT type, config_json FROM notification_channels WHERE org_id = ${org_id} AND enabled = true`;
                    for (const channel of channels.rows) {
                        await sql`
                            INSERT INTO notification_jobs (org_id, type, payload_json, status, attempts)
                            VALUES (
                                ${org_id}, 
                                ${channel.type}, 
                                ${JSON.stringify({
                            webhookUrl: channel.config_json.webhookUrl,
                            event: 'incident.created',
                            incidentId: newIncidentId,
                            title: `[${severity.toUpperCase()}] ${name}`,
                            status: 'open',
                            service: service_id,
                            environment: environment_id,
                            link: `http://localhost:3000/incidents/${newIncidentId}`
                        })}::jsonb, 
                                'pending', 
                                0
                            )
                        `;
                    }
                }
            }

            triggeredRules.push({
                ruleId,
                name,
                type,
                context,
                fingerprint
            });
        }
    }

    await sql`
        INSERT INTO cron_runs (name, status, started_at, finished_at, meta_json)
        VALUES ('rules.evaluate', 'success', ${new Date().toISOString()}, NOW(), ${JSON.stringify({
        evaluated: rules.length,
        triggered: triggeredRules.length,
        incidentsCreated,
        incidentsUpdated
    })})
    `;

    return {
        evaluated: rules.length,
        triggeredCount: triggeredRules.length,
        incidentsCreated,
        incidentsUpdated,
        triggeredRules
    };
}
