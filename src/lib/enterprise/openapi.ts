export const enterpriseOpenApi = {
  openapi:"3.1.0",
  info:{title:"EcoScale Partner Operations API",version:"1.0.0",description:"Tenant-scoped CRM, security, billing and workflow API. CRM stage changes are always explicit commands."},
  servers:[{url:"/"}],
  security:[{bearerAuth:[]}],
  paths:{
    "/api/auth/register":{post:{security:[],summary:"Register user and organization",responses:{"201":{description:"Created"},"409":{description:"Email exists"}}}},
    "/api/auth/login":{post:{security:[],summary:"Create device session",responses:{"200":{description:"Authenticated"},"401":{description:"Invalid credentials or MFA"}}}},
    "/api/auth/refresh":{post:{security:[],summary:"Rotate refresh token",responses:{"200":{description:"Rotated"},"401":{description:"Invalid token"}}}},
    "/api/v1/accounts":{get:{summary:"List CRM account projections",responses:{"200":{description:"Accounts"}}},post:{summary:"Link a Business Intelligence business into CRM",responses:{"201":{description:"Created"}}}},
    "/api/v1/opportunities":{get:{summary:"List manually managed CRM opportunities",responses:{"200":{description:"Opportunities"}}},post:{summary:"Create CRM opportunity",responses:{"201":{description:"Created"}}}},
    "/api/v1/opportunities/{id}/stage":{post:{summary:"Explicitly change CRM stage",parameters:[{name:"id",in:"path",required:true,schema:{type:"string",format:"uuid"}}],responses:{"200":{description:"Stage changed"},"409":{description:"Version conflict"}}}},
    "/api/v1/tasks":{get:{summary:"List tasks",responses:{"200":{description:"Tasks"}}},post:{summary:"Create task",responses:{"201":{description:"Created"}}}},
    "/api/billing":{get:{summary:"List plan, subscription, usage and invoices",responses:{"200":{description:"Billing projection"}}}},
    "/api/billing/usage":{post:{summary:"Record idempotent usage",responses:{"201":{description:"Recorded"}}}},
    "/api/workflows":{get:{summary:"List durable jobs",responses:{"200":{description:"Jobs"}}},post:{summary:"Enqueue idempotent job",responses:{"202":{description:"Accepted"}}}},
    "/api/security/sessions":{get:{summary:"List active device sessions",responses:{"200":{description:"Sessions"}}}},
    "/api/security/api-keys":{get:{summary:"List API key metadata",responses:{"200":{description:"Keys"}}},post:{summary:"Create API key; raw key returned once",responses:{"201":{description:"Created"}}}},
  },
  components:{
    securitySchemes:{bearerAuth:{type:"http",scheme:"bearer",bearerFormat:"JWT or rvk API key"}},
    schemas:{Error:{type:"object",required:["error","code"],properties:{error:{type:"string"},code:{type:"string"}}}},
  },
} as const;
