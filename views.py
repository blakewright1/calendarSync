
def index(request):
    # variables to access the service account calendar
    SCOPES = ['https://www.googleapis.com/auth/calendar.readonly']
    SERVICE_ACCOUNT_FILE = *
    calId = *
    credentials = service_account.Credentials.from_service_account_file(
        SERVICE_ACCOUNT_FILE, scopes=SCOPES)
    account = googleapiclient.discovery.build(
        'calendar', 'v3', credentials=credentials)

    # find the max date

    # grab a list of the next 50 events
    now = datetime.datetime.utcnow().isoformat() + 'Z'
    event_result = account.events().list(  # pylint: disable=no-member
        calendarId=calId, timeMin=now,
        maxResults=50, singleEvents=True,
        orderBy='startTime').execute()
    events = event_result.get('items', [])

    # make list of event times and pass to js
    event_times = []
    for event in events:
        id = (event["id"])
        e = account.events().get(calendarId=calId,  # pylint: disable=no-member
                                 eventId=id).execute()  # pylint: disable=no-member
        event_times.append([e['start'], e['end']])
    dataJSON = dumps(event_times)

    # load the homescreen with the events data available for javascript
    return render(request, "calendarSync/index.html", {'data': dataJSON})
