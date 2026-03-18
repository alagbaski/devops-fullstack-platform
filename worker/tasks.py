from worker import celery

@celery.task(name="tasks.send_email")
def send_email(email):
    print(f"Sending email to {email}")
