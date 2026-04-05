import * as cdk from "aws-cdk-lib";
import { Match, Template } from "aws-cdk-lib/assertions";
import { OneTimeSecretStack } from "../lib/stack";

describe("OneTimeSecretStack", () => {
  let template: Template;

  beforeAll(() => {
    const app = new cdk.App();
    const stack = new OneTimeSecretStack(app, "TestStack");
    template = Template.fromStack(stack);
  });

  it("creates a DynamoDB table with TTL", () => {
    template.hasResourceProperties("AWS::DynamoDB::Table", {
      KeySchema: [{ AttributeName: "pk", KeyType: "HASH" }],
      BillingMode: "PAY_PER_REQUEST",
      TimeToLiveSpecification: {
        AttributeName: "ttl",
        Enabled: true,
      },
    });
  });

  it("creates a Lambda function with Node.js 22.x", () => {
    template.hasResourceProperties("AWS::Lambda::Function", {
      Runtime: "nodejs22.x",
      Handler: "index.handler",
    });
  });

  it("creates a Lambda function URL with no auth", () => {
    template.hasResourceProperties("AWS::Lambda::Url", {
      AuthType: "NONE",
    });
  });

  it("passes TABLE_NAME env var to Lambda", () => {
    template.hasResourceProperties("AWS::Lambda::Function", {
      Environment: {
        Variables: {
          TABLE_NAME: Match.anyValue(),
        },
      },
    });
  });
});
