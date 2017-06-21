

# How to start contributing to Suman

### Longterm

In the long-term the plan is to slowly convert this into a TypeScript project, for type safety
and maintainability. This is easy to do
because we can convert one .js file to a .ts at a time. Very nice. Using tsc --watch we can do an 
incremental build, which is fast. This will allow us to use newer features for development, and then
target earlier versions of JS which is also nice. Object destructuring, anyone?

## As we go:

Please use the dev branch as the base branch to make changes.

Master is the branch that mirrors NPM. Staging is a temporary branch that is used to submit PRs to master.
Once you submit the PR to master, CI/CD tests will run, then if they pass, we delete staging.

You can use this tool to clone all the SumanJS projects onto your machine:

This project will run the ./build.sh file and ./contribute.sh file in each project.
