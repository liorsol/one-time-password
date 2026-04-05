import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME!;

export interface SecretRecord {
  pk: string;
  encryptedText: string;
  iv: string;
  salt: string;
  viewed: boolean;
  createdAt: number;
  ttl: number;
}

export async function putSecret(record: SecretRecord): Promise<void> {
  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: record,
    })
  );
}

export async function getSecret(pk: string): Promise<SecretRecord | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { pk },
    })
  );
  if (!result.Item) return null;
  const record = result.Item as SecretRecord;
  // Check if expired (DynamoDB TTL deletes are eventually consistent)
  if (record.ttl < Math.floor(Date.now() / 1000)) return null;
  return record;
}

export async function markViewed(pk: string, newTtl: number): Promise<void> {
  await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { pk },
      UpdateExpression: "SET viewed = :v, #t = :ttl",
      ExpressionAttributeNames: { "#t": "ttl" },
      ExpressionAttributeValues: { ":v": true, ":ttl": newTtl },
    })
  );
}
