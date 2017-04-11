#!/usr/bin/env bash

BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [[ "$BRANCH" == "dev" && "$BRANCH" == "master" ]]; then
    echo 'Aborting script because you are on master or dev branch.';
    exit 1;
fi

NEW_BRANCH=merge_this_branch_with_dev_$(node -e 'console.log(Date.now())')

git add . &&
git add -A &&
git commit --allow-empty -am "final commit before rebase" &&
git fetch origin &&
git checkout dev &&
git add . &&
git add -A &&
git commit --allow-empty -am "final commit before rebase" &&
git pull &&
git add . &&
git add -A &&
git commit --allow-empty -am "final commit before rebase" &&
git checkout ${BRANCH} &&
git branch -D copy_branch &&
git checkout -b copy_branch &&
git checkout ${BRANCH} &&
echo "now running reset --soft"
git reset --soft dev &&
echo "successfully called reset soft"
git add . &&
git add -A &&
git commit --allow-empty -am "reset:sft" &&
git checkout -b ${NEW_BRANCH}
git push -u origin ${NEW_BRANCH} &&
git checkout ${BRANCH} &&
git merge dev &&
echo "successfully pushed"
