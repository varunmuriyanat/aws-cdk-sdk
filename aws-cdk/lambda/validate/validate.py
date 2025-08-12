import boto3
import csv
import io

s3 = boto3.client('s3')
# Validate CSV file structure
# ensure that the csv file has the required column: customerid
def handler(event, context):
    bucket = event.get('bucket')
    key = event.get('key')

    if not bucket or not key:
        return {"status": "FAILED", "message": "Missing bucket or key"}

    try:
        obj = s3.get_object(Bucket=bucket, Key=key)
        body = obj['Body'].read().decode('utf-8')
        csv_reader = csv.reader(io.StringIO(body))
        header = next(csv_reader)

        if any(col.lower() == 'customerid' for col in header):
            return {"status": "SUCCESS", "message": "'customerid' column found."}
        else:
            return {"status": "FAILED", "message": "'customerid' column NOT found."}

    except Exception as e:
        return {"status": "FAILED", "message": str(e)}
