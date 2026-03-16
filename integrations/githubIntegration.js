const { Octokit } = require("@octokit/rest");

async function commitFiles(token, repoOwner, repoName, path, content) {
    const octokit = new Octokit({ auth: token });
    
    // Logic to push generated automation logs/scripts to GitHub
    await octokit.repos.createOrUpdateFileContents({
        owner: repoOwner,
        repo: repoName,
        path: path,
        message: 'Auto-backup from AUTOLIVE',
        content: Buffer.from(content).toString('base64'),
    });
}
