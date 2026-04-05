#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { OneTimeSecretStack } from "../lib/stack";

const app = new cdk.App();
new OneTimeSecretStack(app, "OneTimeSecretStack");
