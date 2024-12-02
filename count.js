const { Octokit } = require("@octokit/core");
const fs = require('fs');

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

(async () => {
    let votes = { Option1: 0, Option2: 0 };
    let voters = new Set();

    const issues = await octokit.request('GET /repos/{owner}/{repo}/issues', {
        owner: 'cics305-project',
        repo: 'cics305-project.github.io',
        labels: 'vote',
        state: 'all',
        per_page: 100,
    });

    for (const issue of issues.data) {
        if (!voters.has(issue.user.login)) {
            if (issue.title.includes('Option1')) votes.Option1 += 1;
            if (issue.title.includes('Option2')) votes.Option2 += 1;
            voters.add(issue.user.login);
        }

        const comments = await octokit.request('GET /repos/{owner}/{repo}/issues/{issue_number}/comments', {
            owner: 'cics305-project',
            repo: 'cics305-project.github.io',
            issue_number: issue.number,
            per_page: 100,
        });

        for (const comment of comments.data) {
            if (!voters.has(comment.user.login)) {
                const content = comment.body.toLowerCase();
                if (content.includes('option1')) votes.Option1 += 1;
                if (content.includes('option2')) votes.Option2 += 1;
                voters.add(comment.user.login);
            }
        }
    }

    fs.writeFileSync('vote_results.json', JSON.stringify(votes));
})();
