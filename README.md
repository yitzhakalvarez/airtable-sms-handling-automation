# Airtable SMS Handling Automation

## Description

(This automation relies on Zapier - Zap named: “SMS Keyword Handler (Using Front) [Recommended]) - This automation is triggered when a SMS is sent to the Mott Haven Fridge Twilio number (connected to Front.app) containing one of the Shortcodes found in the Shortcode Dictionary section above (case insensitive). When the keywords “start”, “stop”, or “unstop” are detected the script checks or unchecks the field Do not update accordingly. When the keyword “done” is detected the script will match the message’s phone number to a currently dispatched driving volunteer and change their status to “Completed”. When the keyword “update” is detected, the script will find and update the empty fields of the new “Update in progress” record with fields of the old record, once complete the script will delete the old record. When the keyword “do not update” is detected, the script will find and delete the new “Update in progress” record.

## Related Features

- Airtable Duplicate Record Detection Automation
- Airtable Driver Dispatch Automation

## To-Do

### Tables, views, and Fields required

- 🙋🏽 Volunteers CRM
  - Linked Num
  - Phone Number
  - First Name
  - Update in progress
  - Volunteer status
  - Do not contact
- 🚘 Driver: Scheduled Slots
  - Complete / No Show
