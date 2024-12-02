import { Octokit } from "@octokit/core";
import fs from "fs";

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

(async () => {
    let scenarios = {};

    try {
        const issues = await octokit.request("GET /repos/{owner}/{repo}/issues", {
            owner: "cics305-project",
            repo: "cics305-project.github.io",
            labels: "vote",
            state: "all",
            per_page: 100,
        });

        console.log("Fetched Issues:", issues.data);

        for (const issue of issues.data) {
            const scenarioMatch = issue.title.match(/Scenario (\d+)/);
            console.log("Scenario Match:", scenarioMatch);
            if (!scenarioMatch) continue;

            const scenario = `Scenario${scenarioMatch[1]}`;
            if (!scenarios[scenario]) {
                scenarios[scenario] = { Option1: 0, Option2: 0, voters: new Set() };
            }

            console.log(`Processing Issue: ${issue.title}`);
            if (!scenarios[scenario].voters.has(issue.user.login)) {
                if (issue.title.includes("Option1")) {
                    console.log("Detected Option1 in issue title");
                    scenarios[scenario].Option1 += 1;
                }
                if (issue.title.includes("Option2")) {
                    console.log("Detected Option2 in issue title");
                    scenarios[scenario].Option2 += 1;
                }
                scenarios[scenario].voters.add(issue.user.login);
            } else {
                console.log(`Voter ${issue.user.login} already voted in scenario`);
            }

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

            for (const comment of comments.data) {
                console.log(`Processing comment: ${comment.body}`);
                if (!scenarios[scenario].voters.has(comment.user.login)) {
                    const content = comment.body.toLowerCase();
                    if (content.includes("option1")) {
                        console.log("Detected Option1 in comment");
                        scenarios[scenario].Option1 += 1;
                    }
                    if (content.includes("option2")) {
                        console.log("Detected Option2 in comment");
                        scenarios[scenario].Option2 += 1;
                    }
                    scenarios[scenario].voters.add(comment.user.login);
                } else {
                    console.log(`Voter ${comment.user.login} already voted in scenario`);
                }
            }
        }

        for (const scenario of Object.keys(scenarios)) {
            delete scenarios[scenario].voters;
        }

        console.log("Final Scenarios Data:", scenarios);
        fs.writeFileSync("vote_results.json", JSON.stringify(scenarios, null, 2));
    } catch (error) {
        console.error("Error processing votes:", error.message);
        process.exit(1);
    }
})();
