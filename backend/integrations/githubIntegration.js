// backend/integrations/githubIntegration.js
const { Octokit } = require('@octokit/rest');
const logger = require('../utils/logger');

class GitHubIntegration {
    async backupFiles(connection, files, commitMessage) {
        try {
            const octokit = new Octokit({ auth: connection.token });

            const results = [];

            for (const file of files) {
                try {
                    // Check if file exists
                    let sha = null;
                    try {
                        const { data } = await octokit.repos.getContent({
                            owner: connection.repoOwner,
                            repo: connection.repoName,
                            path: file.path
                        });
                        sha = data.sha;
                    } catch (error) {
                        // File doesn't exist, that's fine
                    }

                    // Create or update file
                    const { data } = await octokit.repos.createOrUpdateFileContents({
                        owner: connection.repoOwner,
                        repo: connection.repoName,
                        path: file.path,
                        message: commitMessage,
                        content: Buffer.from(file.content).toString('base64'),
                        sha: sha
                    });

                    results.push({
                        path: file.path,
                        success: true,
                        commitSha: data.commit.sha
                    });
                } catch (error) {
                    logger.error(`Failed to backup file ${file.path}: ${error.message}`);
                    results.push({
                        path: file.path,
                        success: false,
                        error: error.message
                    });
                }
            }

            return {
                success: true,
                filesProcessed: results.length,
                results: results
            };
        } catch (error) {
            logger.error(`GitHub backup failed: ${error.message}`);
            throw error;
        }
    }

    async createRepository(connection, repoName, isPrivate = false) {
        try {
            const octokit = new Octokit({ auth: connection.token });

            const { data } = await octokit.repos.createForAuthenticatedUser({
                name: repoName,
                private: isPrivate,
                auto_init: true,
                description: 'AUTOLIVE Automation Backup Repository'
            });

            return {
                success: true,
                repoName: data.name,
                repoUrl: data.html_url,
                private: data.private
            };
        } catch (error) {
            logger.error(`Failed to create GitHub repository: ${error.message}`);
            throw error;
        }
    }

    async getRepositoryContents(connection, path = '') {
        try {
            const octokit = new Octokit({ auth: connection.token });

            const { data } = await octokit.repos.getContent({
                owner: connection.repoOwner,
                repo: connection.repoName,
                path: path
            });

            return data;
        } catch (error) {
            logger.error(`Failed to get repository contents: ${error.message}`);
            throw error;
        }
    }
}

module.exports = new GitHubIntegration();
