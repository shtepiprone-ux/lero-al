import{j as e}from"./iframe-BWqC60Cj.js";import{S as t}from"./StatusChangeControl-B2oGsX7w.js";import{C as U}from"./circle-BOH7e3tw.js";import{C as W}from"./circle-alert-BUHHVG-c.js";import{C as A}from"./circle-check-CnzcspZt.js";import{C as q}from"./circle-x-DcKQfgdG.js";import"./preload-helper-Dp1pzeXC.js";import"./toast-DoA0WQwD.js";import"./notificationVariants-Cpi4EkRJ.js";import"./triangle-alert-DixzZ8YV.js";import"./createLucideIcon-DZTr3VOw.js";import"./octagon-x-CIwru5Ci.js";import"./button-DqckHWPj.js";import"./index-D4MQtXW4.js";import"./utils-D5ceN5oG.js";import"./useButton-62N7Qls-.js";import"./useIsoLayoutEffect-BlzvCgLy.js";import"./useRenderElement-DCWLj8DQ.js";import"./textarea-DIdBOpiN.js";import"./Combobox-C_XJsO5V.js";import"./mobile-bottom-sheet-tha1BKbV.js";import"./index-PXfbuUw3.js";import"./check-BHCgvXo2.js";import"./chevron-down-B9O36-Ph.js";import"./StatusChangeHistory-BsP7enq4.js";import"./formatters-BY5HUnlf.js";import"./clock-Dtp_wumt.js";import"./loader-circle-DsIh30M6.js";var p,m,v,S,w,f,b,_,h,g,T,N,x,y,k,C,I,R,j,E,K;function O(){return e.jsxs("div",{className:"border border-dashed border-muted-foreground/30 rounded-lg px-3 py-2 bg-muted/10 text-[11px] text-muted-foreground mb-3 space-y-0.5",children:[e.jsxs("p",{className:"font-semibold",children:["StatusChangeControl"," — canonical tiered status primitive"]}),e.jsxs("p",{children:[e.jsx("strong",{children:'variant="select"'}),": low-stakes status changes (Sales/Support Inquiries). Renders a simple select + optional note. No workflow graph."]}),e.jsxs("p",{children:[e.jsx("strong",{children:'variant="workflow"'}),": moderation flows (Support Tickets, Listing status). Renders allowed transition buttons derived from the current status + history log via historyEvents."]}),e.jsxs("p",{children:[e.jsx("strong",{children:"Used in:"})," /admin/inquiries (sales + support), /admin/support (tickets), /admin/listings (listing status). Defined by Epic HH Phase 2, Task 307."]})]})}const me={title:"Admin/StatusChangeControl",tags:["autodocs"],parameters:{docs:{description:{component:'**Canonical tiered status-change primitive (Task 307, Epic HH Phase 2).**\n\n`variant="select"` — low-stakes status changes (Sales Inquiries, Support Inquiries). Renders a dropdown select + optional note textarea. No workflow graph. Used when any status transition is valid.\n\n`variant="workflow"` — moderation flows (Support Tickets, Listing status). Renders explicit transition buttons derived from the `transitions` prop for the current status. Supports `requireNote`, `enableNote`, and `historyEvents` (change log). Used when only certain transitions are permitted from the current state.\n\n**Locale:** `label` is NOT set in story fixtures — the component resolves labels via `t(labelKey)` using the active locale from the Storybook toolbar. Use the locale toolbar to verify all 4 locales.\n\n**Product surfaces:** `/admin/inquiries/sales`, `/admin/inquiries/support` (select variant); `/admin/support` tickets, `/admin/listings` status (workflow variant).\n\n**Story note:** each story shows a `StoryPurposeNote` banner explaining the variant and where it is used. StatusChangeControl is NOT a defect — it is intentionally a control primitive, not a full page layout.'}}}},d=[{code:"new",labelKey:"status_new",badgeVariant:"warning",icon:e.jsx(U,{className:"h-3 w-3"})},{code:"in_progress",labelKey:"status_in_progress",badgeVariant:"info",icon:e.jsx(W,{className:"h-3 w-3"})},{code:"closed",labelKey:"status_closed",badgeVariant:"neutral",icon:e.jsx(A,{className:"h-3 w-3"})}],c=[{code:"open",labelKey:"status_open",badgeVariant:"warning",icon:e.jsx(U,{className:"h-3 w-3"})},{code:"in_progress",labelKey:"status_in_progress",badgeVariant:"info",icon:e.jsx(W,{className:"h-3 w-3"})},{code:"resolved",labelKey:"status_resolved",badgeVariant:"success",icon:e.jsx(A,{className:"h-3 w-3"})},{code:"closed",labelKey:"status_closed",badgeVariant:"neutral",icon:e.jsx(q,{className:"h-3 w-3"})}],u=[{from:"open",to:"in_progress",labelKey:"status_in_progress"},{from:"open",to:"resolved",labelKey:"status_resolved"},{from:"open",to:"closed",labelKey:"action_close",destructive:!0},{from:"in_progress",to:"resolved",labelKey:"status_resolved"},{from:"in_progress",to:"closed",labelKey:"action_close",destructive:!0},{from:"resolved",to:"open",labelKey:"action_reopen"},{from:"resolved",to:"closed",labelKey:"action_close",destructive:!0},{from:"closed",to:"open",labelKey:"action_reopen"}],H=[{id:"1",fromStatus:"new",toStatus:"in_progress",note:null,actorName:"Admin",createdAt:"2026-05-30T10:00:00Z"},{id:"2",fromStatus:"in_progress",toStatus:"closed",note:null,actorName:"Moderator",createdAt:"2026-05-31T09:00:00Z"}],s={parameters:{docs:{description:{story:'`variant="select"` — low-stakes inquiry status change. Any transition is valid. Labels resolved via t(labelKey) — use locale toolbar to verify sq/en/uk/it.'}}},render:()=>e.jsxs("div",{className:"w-full p-4 sm:max-w-xs",children:[e.jsx(O,{}),e.jsx(t,{variant:"select",currentStatus:"new",statuses:d,onSubmit:()=>{}})]}),globals:{viewport:{value:"desktop1280",isRotated:!1}}},o={parameters:{docs:{description:{story:'@320: variant="select" dropdown opens as a full-width bottom sheet — edge-to-edge, drag handle, items >=44px. Use locale toolbar.'}}},render:()=>e.jsx("div",{className:"w-full p-3",children:e.jsx(t,{variant:"select",currentStatus:"new",statuses:d,onSubmit:()=>{},defaultOpen:!0})}),globals:{viewport:{value:"mobile320",isRotated:!1}}},r={render:()=>e.jsx("div",{className:"w-full p-4 sm:max-w-xs",children:e.jsx(t,{variant:"select",currentStatus:"in_progress",statuses:d,enableNote:!0,onSubmit:()=>{}})}),globals:{viewport:{value:"desktop1280",isRotated:!1}}},a={render:()=>e.jsx("div",{className:"w-full p-4 sm:max-w-sm",children:e.jsx(t,{variant:"workflow",currentStatus:"open",statuses:c,transitions:u,onSubmit:()=>{}})}),globals:{viewport:{value:"desktop1280",isRotated:!1}}},i={render:()=>e.jsx("div",{className:"w-full p-4 sm:max-w-sm",children:e.jsx(t,{variant:"workflow",currentStatus:"in_progress",statuses:c,transitions:u,requireNote:!0,onSubmit:()=>{}})}),globals:{viewport:{value:"desktop1280",isRotated:!1}}},l={render:()=>e.jsx("div",{className:"w-full p-4 sm:max-w-sm",children:e.jsx(t,{variant:"workflow",currentStatus:"resolved",statuses:c,transitions:u,historyEvents:H,onSubmit:()=>{}})}),globals:{viewport:{value:"desktop1280",isRotated:!1}}},n={parameters:{docs:{description:{story:"uk@320: Ukrainian labels via t(labelKey) — no hardcoded locale fixtures needed. Use locale toolbar for other locales; viewport toolbar for other widths."}}},render:()=>e.jsxs("div",{className:"p-3 space-y-4",children:[e.jsx(t,{variant:"workflow",currentStatus:"open",statuses:c,transitions:u,onSubmit:()=>{}}),e.jsx(t,{variant:"select",currentStatus:"new",statuses:d,onSubmit:()=>{}})]}),globals:{viewport:{value:"mobile320",isRotated:!1}}};s.parameters={...s.parameters,docs:{...(p=s.parameters)===null||p===void 0?void 0:p.docs,source:{originalSource:`{
  parameters: {
    docs: {
      description: {
        story: '\`variant="select"\` — low-stakes inquiry status change. Any transition is valid. Labels resolved via t(labelKey) — use locale toolbar to verify sq/en/uk/it.'
      }
    }
  },
  render: () => <div className="w-full p-4 sm:max-w-xs">\r
      <StoryPurposeNote />\r
      <StatusChangeControl variant="select" currentStatus={'new' as IStatus} statuses={INQUIRY_STATUSES} onSubmit={() => {}} />\r
    </div>,
  globals: {
    viewport: {
      value: 'desktop1280',
      isRotated: false
    }
  }
}`,...(v=s.parameters)===null||v===void 0||(m=v.docs)===null||m===void 0?void 0:m.source}}};o.parameters={...o.parameters,docs:{...(S=o.parameters)===null||S===void 0?void 0:S.docs,source:{originalSource:`{
  parameters: {
    docs: {
      description: {
        story: '@320: variant="select" dropdown opens as a full-width bottom sheet — edge-to-edge, drag handle, items >=44px. Use locale toolbar.'
      }
    }
  },
  render: () => <div className="w-full p-3">\r
      <StatusChangeControl variant="select" currentStatus={'new' as IStatus} statuses={INQUIRY_STATUSES} onSubmit={() => {}} defaultOpen />\r
    </div>,
  globals: {
    viewport: {
      value: 'mobile320',
      isRotated: false
    }
  }
}`,...(f=o.parameters)===null||f===void 0||(w=f.docs)===null||w===void 0?void 0:w.source}}};r.parameters={...r.parameters,docs:{...(b=r.parameters)===null||b===void 0?void 0:b.docs,source:{originalSource:`{
  render: () => <div className="w-full p-4 sm:max-w-xs">\r
      <StatusChangeControl variant="select" currentStatus={'in_progress' as IStatus} statuses={INQUIRY_STATUSES} enableNote onSubmit={() => {}} />\r
    </div>,
  globals: {
    viewport: {
      value: 'desktop1280',
      isRotated: false
    }
  }
}`,...(h=r.parameters)===null||h===void 0||(_=h.docs)===null||_===void 0?void 0:_.source}}};a.parameters={...a.parameters,docs:{...(g=a.parameters)===null||g===void 0?void 0:g.docs,source:{originalSource:`{
  render: () => <div className="w-full p-4 sm:max-w-sm">\r
      <StatusChangeControl variant="workflow" currentStatus={'open' as TStatus} statuses={TICKET_STATUSES} transitions={TICKET_TRANSITIONS} onSubmit={() => {}} />\r
    </div>,
  globals: {
    viewport: {
      value: 'desktop1280',
      isRotated: false
    }
  }
}`,...(N=a.parameters)===null||N===void 0||(T=N.docs)===null||T===void 0?void 0:T.source}}};i.parameters={...i.parameters,docs:{...(x=i.parameters)===null||x===void 0?void 0:x.docs,source:{originalSource:`{
  render: () => <div className="w-full p-4 sm:max-w-sm">\r
      <StatusChangeControl variant="workflow" currentStatus={'in_progress' as TStatus} statuses={TICKET_STATUSES} transitions={TICKET_TRANSITIONS} requireNote onSubmit={() => {}} />\r
    </div>,
  globals: {
    viewport: {
      value: 'desktop1280',
      isRotated: false
    }
  }
}`,...(k=i.parameters)===null||k===void 0||(y=k.docs)===null||y===void 0?void 0:y.source}}};l.parameters={...l.parameters,docs:{...(C=l.parameters)===null||C===void 0?void 0:C.docs,source:{originalSource:`{
  render: () => <div className="w-full p-4 sm:max-w-sm">\r
      <StatusChangeControl variant="workflow" currentStatus={'resolved' as TStatus} statuses={TICKET_STATUSES} transitions={TICKET_TRANSITIONS} historyEvents={HISTORY_EVENTS} onSubmit={() => {}} />\r
    </div>,
  globals: {
    viewport: {
      value: 'desktop1280',
      isRotated: false
    }
  }
}`,...(R=l.parameters)===null||R===void 0||(I=R.docs)===null||I===void 0?void 0:I.source}}};n.parameters={...n.parameters,docs:{...(j=n.parameters)===null||j===void 0?void 0:j.docs,source:{originalSource:`{
  parameters: {
    docs: {
      description: {
        story: 'uk@320: Ukrainian labels via t(labelKey) — no hardcoded locale fixtures needed. Use locale toolbar for other locales; viewport toolbar for other widths.'
      }
    }
  },
  render: () => <div className="p-3 space-y-4">\r
      <StatusChangeControl variant="workflow" currentStatus={'open' as TStatus} statuses={TICKET_STATUSES} transitions={TICKET_TRANSITIONS} onSubmit={() => {}} />\r
      <StatusChangeControl variant="select" currentStatus={'new' as IStatus} statuses={INQUIRY_STATUSES} onSubmit={() => {}} />\r
    </div>,
  globals: {
    viewport: {
      value: 'mobile320',
      isRotated: false
    }
  }
}`,...(K=n.parameters)===null||K===void 0||(E=K.docs)===null||E===void 0?void 0:E.source}}};const ve=["Select","SelectMobileBottomSheet","SelectWithNote","Workflow","WorkflowRequiredNote","WorkflowWithHistory","LocaleStress"];export{n as LocaleStress,s as Select,o as SelectMobileBottomSheet,r as SelectWithNote,a as Workflow,i as WorkflowRequiredNote,l as WorkflowWithHistory,ve as __namedExportsOrder,me as default};
