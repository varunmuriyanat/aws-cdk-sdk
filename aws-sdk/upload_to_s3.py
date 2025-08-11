import boto3

# Create an S3 client
s3 = boto3.client('s3')

# Your bucket and file details
bucket_name = "com.varunmuriyanat.raw-vault"
file_path = "customers_100.csv"       # local CSV file path
s3_key = "uploads/customers_100.csv"        # path inside the bucket

try:
    s3.upload_file(file_path, bucket_name, s3_key)
    print(f"✅ Successfully uploaded {file_path} to s3://{bucket_name}/{s3_key}")
except Exception as e:
    print(f"❌ Upload failed: {e}")
