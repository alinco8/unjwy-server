import { Octokit } from '@octokit/rest';
import { fetch } from 'cross-fetch';
import express from 'express';

const app = express();
const port = process.env.PORT || 3000;
const router = express.Router();
const octokit = new Octokit({ request: fetch });

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, access_token');

    next();
});

router.get('/latest', async (req, res) => {
    const response = await octokit.rest.repos.getLatestRelease({
        repo: 'ultimate-nokori-jikan-wakaru-yaatu',
        owner: 'alinco8',
    });

    const assets = await octokit.rest.repos.listReleaseAssets({
        owner: 'alinco8',
        repo: 'ultimate-nokori-jikan-wakaru-yaatu',
        release_id: response.data.id,
    });

    const tar = assets.data.find(({ name }) => name === '_aarch64.app.tar.gz');
    const tarSig = assets.data.find(({ name }) => name === '_aarch64.app.tar.gz.sig');

    if (!tar || !tarSig) {
        return res.json({ message: '!tar||!tarSig' });
    }

    const signature = await (await fetch(tarSig.browser_download_url)).text();

    res.json({
        version: response.data.tag_name,
        notes: response.data.body,
        pub_date: response.data.published_at,
        platforms: {
            'darwin-aarch64': {
                signature,
                url: tar.browser_download_url,
            },
        },
    });
});

app.use('/releases', router);

app.listen(port, () => {
    console.log('Server running(%s)...', port);
});
