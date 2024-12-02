import { Octokit } from "@octokit/core";
import fs from "fs";

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

(async () => {
    let scenarios = {};

    try {
        // Fetch all issues labeled 'vote'
        const issues = await octokit.request("GET /repos/{owner}/{repo}/issues", {
            owner: "cics305-project",
            repo: "cics305-project.github.io",
            labels: "vote",
            state: "all",
            per_page: 100,
        });
        console.log("Fetched Issues:", issues.data);
        for (const issue of issues.data) {
            // Identify scenario from issue title
            const scenarioMatch = issue.title.match(/Scenario (\d+)/);
            if (!scenarioMatch) continue;

            const scenario = `Scenario${scenarioMatch[1]}`;
            if (!scenarios[scenario]) {
                scenarios[scenario] = { Option1: 0, Option2: 0, voters: new Set() };
            }

            // Count votes from issue title
            if (!scenarios[scenario].voters.has(issue.user.login)) {
                if (issue.title.includes("Option1")) scenarios[scenario].Option1 += 1;
                if (issue.title.includes("Option2")) scenarios[scenario].Option2 += 1;
                scenarios[scenario].voters.add(issue.user.login);
            }

            // Fetch comments for the issue
            const comments = await octokit.request(
                "GET /repos/{owner}/{repo}/issues/{issue_number}/comments",
                {
                    owner: "cics305-project",
                    repo: "cics305-project.github.io",
                    issue_number: issue.number,
                    per_page: 100,
                }
            );
            console.log(`Comments for Issue ${issue.number}:`, comments.data);

            // Count votes from comments
            for (const comment of comments.data) {
                if (!scenarios[scenario].voters.has(comment.user.login)) {
                    const content = comment.body.toLowerCase();
                    if (content.includes("option1")) scenarios[scenario].Option1 += 1;
                    if (content.includes("option2")) scenarios[scenario].Option2 += 1;
                    scenarios[scenario].voters.add(comment.user.login);
                }
            }
        }

        // Remove voter details before saving results
        for (const scenario of Object.keys(scenarios)) {
            delete scenarios[scenario].voters;
        }

        // Save results to vote_results.json
        fs.writeFileSync("vote_results.json", JSON.stringify(scenarios, null, 2));
        console.log("Vote results updated:", scenarios);
    } catch (error) {
        console.error("Error processing votes:", error.message);
        process.exit(1);
    }
})();
