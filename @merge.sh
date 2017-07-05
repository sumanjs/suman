#!/usr/bin/env bash

BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [[ "$BRANCH" != "rebase_branch" ]]; then
    echo 'Aborting script because you are on rebase_branch branch.';
    exit 1;
fi

NEW_BRANCH=merge_this_branch_with_dev_$(node -e 'console.log(Date.now())')

git add . &&
git add -A &&
git commit --allow-empty -am "final commit before rebase 1" &&
git push &&
git fetch origin &&
git checkout dev &&
git add . &&
git add -A &&
git commit --allow-empty -am "final commit before rebase 2" &&
git pull &&
git add . &&
git add -A &&
git commit --allow-empty -am "final commit before rebase 3" &&
git checkout ${BRANCH} &&
git branch -D copy_branch &&
git checkout -b copy_branch &&
git checkout ${BRANCH} &&
git add -all &&
git reset --hard HEAD &&  # this gets rid of untracked files somehow?
echo "now running reset --soft"
git reset --soft dev &&
echo "successfully called reset soft"
git add . &&
git add -A &&
git commit --allow-empty -am "reset:sft" &&
git checkout -b ${NEW_BRANCH} &&
git push -u origin ${NEW_BRANCH} &&
git checkout ${BRANCH} &&
git branch -D ${NEW_BRANCH} &&
#git merge dev &&
echo "successfully pushed"
