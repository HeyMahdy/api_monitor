
import {getAlertConfigsByMonitorId} from '../Repository/AlertChannelRepo.js'

import {notifyIncidentCreated,notifyIncidentAcknowledged,notifyIncidentResolved} from '../services/webhook.service.js'



export const NotifyIncidentCreated = async(monitor_id:string,data:any):Promise<any>=>{

    const {monitor_data:monitor_data,...insident} = data;

      const alerts = await getAlertConfigsByMonitorId(monitor_id);



for (const alert of alerts) {
    if (alert.type === 'WEBHOOK') {
        // You can access .url directly
         await notifyIncidentCreated(alert.config.url,insident,monitor_data)
    }
    
    if (alert.type === 'EMAIL') {
        console.log("Sending to:", alert.config.email);
    }
}

      
}

export const NotifyIncidentAcknowledged = async(data:any):Promise<any>=>{


     console.log("inside ack now")

    const {monitor_data:monitor_data,...insident} = data;
    
    console.log(monitor_data);
    
     
         const alerts = await getAlertConfigsByMonitorId(monitor_data.id);
         console.log("this is alrt");
         console.log(alerts);

for (const alert of alerts) {
    console.log("this is here");
    if (alert.type === 'WEBHOOK') {
        // You can access .url directly
        console.log("this is here 2");
         await notifyIncidentAcknowledged(alert.config.url,insident,monitor_data)
    }
    
    if (alert.type === 'EMAIL') {
        console.log("Sending to:", alert.config.email);
    }
}


      
}


export const NotifyIncidentResolved = async(data:any):Promise<any>=>{

    const {monitor_data:monitor_data,...insident} = data;

      const alerts = await getAlertConfigsByMonitorId(monitor_data.id);



for (const alert of alerts) {
    if (alert.type === 'WEBHOOK') {
        // You can access .url directly
         await notifyIncidentResolved(alert.config.url,insident,monitor_data)
    }
    
    if (alert.type === 'EMAIL') {
        console.log("Sending to:", alert.config.email);
    }
}

      
}