#!/bin/bash
bucket=$1

# Delete all versions
versions=$(aws s3api list-object-versions --bucket $bucket)
aws s3api delete-objects --bucket $bucket --delete "$(echo $versions | jq '{Objects: .Versions | map({Key: .Key, VersionId: .VersionId})}')"

# Delete all delete markers
aws s3api delete-objects --bucket $bucket --delete "$(echo $versions | jq '{Objects: .DeleteMarkers | map({Key: .Key, VersionId: .VersionId})}')"

# Delete the bucket
aws s3api delete-bucket --bucket $bucket

# Check if the bucket is deleted
if ! aws s3api head-bucket --bucket $bucket 2>/dev/null; then
  echo "Bucket $bucket deleted successfully."
else
  echo "Bucket $bucket still exists."
fi