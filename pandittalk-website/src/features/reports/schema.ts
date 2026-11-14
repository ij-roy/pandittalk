import { record } from "../tools/schemas";
export const reportTypes=["detailed_kundli","detailed_compatibility","monthly_horoscope"] as const;
export type Report={id:string;type:typeof reportTypes[number];title:string;inputSummary:string;coinsSpent:number;createdAt:string;payload?:unknown};
export function parseReport(v:unknown):Report {const r=record(v);if(typeof r.id!=="string"||typeof r.title!=="string"||typeof r.inputSummary!=="string"||!reportTypes.includes(r.type as Report["type"])||typeof r.coinsSpent!=="number"||!Number.isInteger(r.coinsSpent)||r.coinsSpent<0||typeof r.createdAt!=="string"||Number.isNaN(Date.parse(r.createdAt)))throw new Error("This report has an unsupported format. Please contact support.");return r as Report;}
