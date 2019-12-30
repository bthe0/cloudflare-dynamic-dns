const publicIp = require('public-ip');
const cf = require('cloudflare');
const config = require('./config');

const updateRecords = async () => {
    let ip = await publicIp.v4();
    let client = cf(config.cloudflare);

    console.log('Updating DNS records...');
    const {result: zones} = await client.zones.browse();

    for (const zone of zones) {
        for (const route of config.routes) {
            if (zone.name !== route[0]) {
                continue;
            }

            const {result: dnsRecords} = await client.dnsRecords.browse(zone.id);

            for (const record of dnsRecords) {
                if (record.type !== route[1] || record.name !== route[2]) {
                    continue;
                }

                if (record.content === ip) {
                    continue;
                }

                console.log(`Updating ${route.join(' | ')}`);
                record.content = ip;
                console.log(await client.dnsRecords.edit(zone.id, record.id, record));
            }
        }
    }

    console.log('Done');
};

process.on('uncaughtException', console.error);


setInterval(updateRecords, config.updateInterval * 60 * 1000)
