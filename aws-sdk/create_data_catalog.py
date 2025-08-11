import boto3

glue = boto3.client('glue')

response = glue.create_database(
    DatabaseInput={
        'Name': 'varun_datacatalog',
        'Description': 'Data catalog for processed analytics tables',
        'LocationUri': 's3://com.varunmuriyanat.raw-vault/'
    }
)

print("Database created:", response)
