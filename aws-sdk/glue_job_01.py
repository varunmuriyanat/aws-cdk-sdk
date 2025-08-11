
import sys
from awsglue.transforms import *
from awsglue.utils import getResolvedOptions
from pyspark.context import SparkContext
from awsglue.context import GlueContext
from awsglue.job import Job
from awsglue.dynamicframe import DynamicFrame

# Get job arguments
args = getResolvedOptions(sys.argv, ["JOB_NAME", "INPUT_PATH", "OUTPUT_PATH", "OUTPUT_FORMAT"])

sc = SparkContext()
glueContext = GlueContext(sc)
spark = glueContext.spark_session
job = Job(glueContext)
job.init(args["JOB_NAME"], args)

# Read CSV as DynamicFrame
input_dynamic_frame = glueContext.create_dynamic_frame.from_options(
    connection_type="s3",
    connection_options={"paths": [args["INPUT_PATH"]]},
    format="csv",
    format_options={"withHeader": True}
)

# (Optional) Convert to DataFrame for Spark transformations
df = input_dynamic_frame.toDF()

# # Example transformation: filter customerid > 25
# df_filtered = (
#         df.filter("customerid > 25")
#             .select(
#                 "customerid",
#                 "firstname",
#                 "lastname",
#                 "email",
#                 "phone",
#                 "country",
#                 "datejoined",
#                 "isactive"
#             )
# )

# Convert back to DynamicFrame
# output_dynamic_frame = glueContext.create_dynamic_frame.from_df(df_filtered, glueContext)
output_dynamic_frame = DynamicFrame.fromDF(df, glueContext, "output_dynamic_frame")

# Write output in specified format (parquet or orc)
output_format = args["OUTPUT_FORMAT"].lower()
if output_format not in ["parquet", "orc"]:
    raise ValueError("OUTPUT_FORMAT must be 'parquet' or 'orc'")

glueContext.write_dynamic_frame.from_options(
    frame=output_dynamic_frame,
    connection_type="s3",
    connection_options={"path": args["OUTPUT_PATH"]},
    format=output_format
)

job.commit()
