import csv
import random
from faker import Faker

fake = Faker()

fieldnames = ["CustomerID", "FirstName", "LastName", "Email", "Phone", "Country", "DateJoined", "IsActive"]

countries = ["USA", "Canada", "UK", "Australia", "Germany", "France", "Mexico", "India", "Brazil", "Japan"]

with open("customers_100.csv", mode="w", newline="") as file:
    writer = csv.DictWriter(file, fieldnames=fieldnames)
    writer.writeheader()

    for customer_id in range(1, 101):
        first_name = fake.first_name()
        last_name = fake.last_name()
        email = f"{first_name.lower()}.{last_name.lower()}@example.com"
        phone = fake.phone_number()
        country = random.choice(countries)
        date_joined = fake.date_between(start_date="-5y", end_date="today").isoformat()
        is_active = random.choice([True, False])

        writer.writerow({
            "CustomerID": customer_id,
            "FirstName": first_name,
            "LastName": last_name,
            "Email": email,
            "Phone": phone,
            "Country": country,
            "DateJoined": date_joined,
            "IsActive": is_active
        })

print("customers_100.csv generated!")

