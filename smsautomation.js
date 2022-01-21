try {
    //get webhook data
    let inputConfig = input.config();

    //getting number
    let num = inputConfig.num.replace(/\D/g, "").slice(-10);

    //getting message
    let message = inputConfig.message.trim().toLowerCase();
    console.log(message);

    //this webhook is a change in opt-out status
    if (message == 'start' || message == 'stop' || message == 'unstop') {

        //open Volunteer CRM table
        let table = base.getTable("🙋🏽Volunteers CRM");
        let query = await table.selectRecordsAsync();

        //determining if user subscribed or unsubscribed:
        //user unsubscribed
        if (message == 'stop') {

            //need to find record that has a phone number matching {num}
            let rec = query.records.filter(value => {
                if (value.getCellValue("Phone Number") != null && value.getCellValue("Update in progress") == null) {
                    if (value.getCellValue("Phone Number").replace(/\D/g, "").slice(-10).indexOf(num) != -1)
                        return value;
                }
            });

            //updating "Do not contact" field
            if (rec != null)
                await table.updateRecordAsync(rec[0], { "Do not contact": true });
        }

        //user subscribed
        else if (message == 'start' || message == 'unstop') {

            //need to find record that has a phone number matching {num}
            let rec = query.records.filter(value => {
                if (value.getCellValue("Phone Number") != null && value.getCellValue("Update in progress") == null) {
                    if (value.getCellValue("Phone Number").replace(/\D/g, "").slice(-10).indexOf(num) != -1)
                        return value;
                }
            });

            //updating "Do not contact" field
            if (rec != null)
                await table.updateRecordAsync(rec[0], { "Do not contact": false });
        }
    }

    //this webhook is a confirmation or decline of a profile update
    if (message == 'update' || message == 'do not update') {

        //open Volunteer CRM table
        let table = base.getTable("🙋🏽Volunteers CRM");
        let query = await table.selectRecordsAsync();

        //get list of new duplicates
        let newDuplicate = query.records.filter(value => {
            if (value.getCellValue("Update in progress") != null && value.getCellValue("Needs attention") == null) {
                if (value.getCellValue("Linked Num") != null && value.getCellValue("Linked Num")[0].name.replace(/\D/g, "").slice(-10).indexOf(num) != -1)
                    return value;
                else if (value.getCellValue("Phone Number") != null && value.getCellValue("Phone Number").replace(/\D/g, "").slice(-10).indexOf(num) != -1)
                    return value;
            }
        })

        //a new duplicate exists and user wants to update
        if (newDuplicate.length != 0 && message == 'update') {

            //update the new record
            let newRecord = newDuplicate[0];
            let linkedNum = newRecord.getCellValue("Linked Num");

            //check if linked number exists first
            if (linkedNum != null) {

                //duplicate record is the linked number

                //getting the old and new records
                let record = query.getRecord(linkedNum[0].id);

                //for each field in new record that is empty, get data from old record
                for (let field of table.fields) {
                    if (!field.isComputed && field.name.indexOf("Volunteer Status") == -1) {
                        if (newRecord.getCellValue(field.name) == null && record.getCellValue(field.name) != null) {
                            await table.updateRecordAsync(newRecord, { [field.name]: record.getCellValue(field.name) });
                        }
                    }
                }

                //delete old record
                await table.deleteRecordAsync(record);
            }

            //a linked number does not exist so we find matching phone numbers
            else if (newRecord.getCellValue("Phone Number") != null) {

                //duplicate record may or may not exist, compare phone numbers
                let duplicates = query.records.filter(rec => {
                    if (rec.getCellValue("Phone Number") != null && rec.getCellValue("Update in progress") == null) {
                        let existingNum = rec.getCellValue("Phone Number").replace(/\D/g, "").slice(-10);
                        let newNum = newRecord.getCellValue("Phone Number").replace(/\D/g, "").slice(-10);
                        if (existingNum.indexOf(newNum) != -1 && rec.id.indexOf(newRecord.id) == -1)
                            return rec;
                    }
                });

                //if duplicates is not null then duplicates exist
                if (duplicates.length != 0) {
                    //for each field in new record that is empty, get data from old record
                    for (let record of duplicates) {
                        for (let field of table.fields) {
                            if (!field.isComputed && field.name.indexOf("Volunteer Status") == -1) {
                                if (newRecord.getCellValue(field.name) == null && record.getCellValue(field.name) != null) {
                                    await table.updateRecordAsync(newRecord, { [field.name]: record.getCellValue(field.name) });
                                }
                            }
                        }
                        //delete all duplicates
                        await table.deleteRecordAsync(record);
                    }
                }
            }

            //set new duplicate to false
            await table.updateRecordAsync(newRecord, { "Update in progress": false });
            //set unflagged
            await table.updateRecordAsync(newRecord, { "Needs attention": false });
        }

        //a new duplicate exists and user does not want to update
        else if (newDuplicate.length != 0 && message == 'do not update') {
            //delete the new duplicates
            for (let rec of newDuplicate) {
                table.deleteRecordAsync(rec);
            }
        }
    }

    //this webhook is a change of driving status to completed
    if (message == 'done') {

        //open Driving slots table
        let table = base.getTable("🚘 2. Driver: Scheduled Slots");
        let query = await table.selectRecordsAsync();

        //need to find record that has a phone number matching {num}
        let rec = query.records.filter(value => {
            if (value.getCellValue("Phone Number") != null && value.getCellValue("Phone Number")[0].name.replace(/\D/g, "").slice(-10).indexOf(num) != -1) {
                if (value.getCellValue("Complete / No Show") != null && value.getCellValue("Complete / No Show").name == 'Dispatched')
                    return value;
            }
        });

        //if rec is empty then look for archived records
        // if(rec.length == 0){
        //     let rec2 = query.records.filter(value => {
        //         if(value.getCellValue("Phone Number") != null && value.getCellValue("Phone Number")[0].name.replace(/\D/g, "").slice(-10).indexOf(num) != -1){
        //             if(value.getCellValue("Complete / No Show") != null && value.getCellValue("Complete / No Show").name == 'Archived')
        //                 return value;
        //         }
        //     });

        //     if(rec2.length > 0){
        //         await table.updateRecordAsync(rec2[0], {"Complete / No Show": {name: "Completed"}});
        //     }
        // }

        if (rec.length > 0)
            await table.updateRecordAsync(rec[0], { "Complete / No Show": { name: "Completed" } });
    }
}
catch (err) {
    console.log(err);
}
