import { Application, Context} from 'probot' // eslint-disable-line no-unused-vars
import {RestEndpointMethodTypes} from "@octokit/rest";

// type ChecksCreateParams = RestEndpointMethodTypes["checks"]["create"]["parameters"];

type Conclusion = RestEndpointMethodTypes["checks"]["create"]["parameters"]["conclusion"];
type Status = RestEndpointMethodTypes["checks"]["create"]["parameters"]["status"];

// type Conclusion = "failure" | "success" | "neutral" | "cancelled" | "timed_out" | "action_required" | undefined;

async function setStatusCheck(context: Context, head_sha: string, isValid: boolean) {

  let conclusion: Conclusion = "failure";
  const status: Status = "completed";

  if (isValid) {
    conclusion = "success";
  }

  
  let checkOptions = {
    name: "milestone-set",
    status: status,
    conclusion: conclusion,
    head_branch: '', // workaround for https://github.com/octokit/rest.js/issues/874
    head_sha: head_sha,
    output: {
      title: "A milestone has to be set",
      summary: `Consider adding a version milestone or 'Backlog'`
    },
  };

  if (isValid) {
    checkOptions.output.title = 'Milestone is set!';
    checkOptions.output.summary = 'A milestone has been assigned';
  }

  await context.github.checks.create(context.repo(checkOptions));


}

export = (app: Application) => {
  app.on('pull_request', async (context) => {

    const action = context.payload.action;

    if (!["synchronize", "opened"].includes(action)) {
      return;
    }
    console.log(`PR ${action}`);

    const {pull_request: pr} = context.payload;

    const isMilestoned = pr.milestone !== null;

    console.log(`Is milestoned? ${isMilestoned}`);

    await setStatusCheck(context, pr.head.sha, isMilestoned);
  });

  app.on("issues", async (context) => {
    const {issue} = context.payload;
    console.log("Issue milestone changed:", issue.number);
    let number = issue.number;

    // is it a pr?
    if (!("pull_request" in issue)) {
      console.log("Is not a PR");
      return;
    }
    console.log("Is PR");

    const pr = await context.github.pulls.get(context.repo({pull_number: number}));

    const isMilestoned = context.payload.action === "milestoned";
    console.log("Is milestoned:", isMilestoned);

    await setStatusCheck(context, pr.data.head.sha, isMilestoned);
  });
}
