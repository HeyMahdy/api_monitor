import axios, { AxiosError } from 'axios';
import type { AxiosRequestConfig } from 'axios';

export interface HealthCheckResult {
    monitorId:string;
    method:string;
    statusCode?: number;
    responseTimeMs: number;
    errorType?: string | undefined;
    errorMessage?: string | undefined;
    timestamp: Date;
    status: boolean; 
    url:string;
}

export class HealthCheckService {
    
    
    static async check(monitorId:string,url: string, method: string, headers: any, body: any, timeoutSeconds: number): Promise<HealthCheckResult> {
        
        const startTime = performance.now();
        
        const config: AxiosRequestConfig = {
            url,
            method: method || 'GET',
            headers: {
                ...headers,
                'User-Agent': 'api-monitor/1.0' 
            },
            data: body,
            timeout: timeoutSeconds * 1000, 
            validateStatus: () => true, 
        };

        try {
            // The actual request
            const response = await axios(config);
            const duration = Math.floor(performance.now() - startTime);

            // Determine if it is "UP" (usually 2xx statusconst isUp = 
            let isUp ;
            if(response.status >= 200 && response.status < 300){
                isUp = true;
            }
            else{
                isUp = false;
            }

            return {
                monitorId:monitorId,
                url:url,
                method:method,
                statusCode: response.status,
                responseTimeMs: duration,
                timestamp: new Date(),
                status: isUp,
                errorType: isUp ? undefined : 'HTTP_ERROR',
                errorMessage: isUp ? undefined : `Request failed with status ${response.status}`
            };

        } catch (error: any) {
            console.log(3);
            const duration = Math.floor(performance.now() - startTime);
            
            // Handle Network Errors (Timeout, DNS, etc.)
            let errorType: HealthCheckResult['errorType'] = 'UNKNOWN';
            let errorMessage = error.message;

            if (axios.isAxiosError(error)) {
                if (error.code === 'ECONNABORTED') {
                    errorType = 'TIMEOUT';
                    errorMessage = `Timeout of ${timeoutSeconds}s exceeded`;
                } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
                    errorType = 'NETWORK';
                }
            }

            return {
                monitorId:monitorId,
                url:url,
                method:method,
                statusCode: 0, 
                responseTimeMs: duration,
                timestamp: new Date(),
                status: false,
                errorType:errorType,
                errorMessage:errorMessage
            };
        }
    }
}