import{j as l}from"./iframe-BWqC60Cj.js";import{S as s}from"./StatusChangeHistory-BsP7enq4.js";import{s as C}from"./_storyI18n-DUPbxmag.js";import"./preload-helper-Dp1pzeXC.js";import"./formatters-BY5HUnlf.js";import"./index-PXfbuUw3.js";import"./clock-Dtp_wumt.js";import"./createLucideIcon-DZTr3VOw.js";var p,u,v,_,b,g,S,y,f,h,w,k,T,x,A;const q={title:"Admin/StatusChangeHistory",component:s,tags:["autodocs"],parameters:{docs:{description:{component:'Read-only timeline of status-change events. Used inside StatusChangeControl variant="workflow". Normal stories supply a `labelFormatter` so both sides of every transition are localized human-readable labels — never raw snake_case enums. Default component fallback: snake_case → Title Case (safe, never leaks raw keys). Breakpoints verified via the Storybook viewport toolbar; locales via the locale toolbar.'}}}},E=[{id:"1",fromStatus:"open",toStatus:"in_progress",note:null,actorName:"Admin",createdAt:"2026-05-30T10:00:00Z"},{id:"2",fromStatus:"in_progress",toStatus:"resolved",note:null,actorName:"Moderator",createdAt:"2026-05-31T09:00:00Z"}],Z={open:"state_open",in_progress:"state_in_progress",resolved:"state_resolved",closed:"state_closed",new:"state_new",pending:"state_pending"},N=r=>e=>{const o=Z[e];return o?C(r,`storybook.admin_history.${o}`):e.replace(/_/g," ").replace(/\b\w/g,t=>t.toUpperCase())},F=(r,e="en")=>C(e,`storybook.admin_history.${r}`),n={render:()=>l.jsx(s,{events:[]})},i={parameters:{docs:{description:{story:"One event. labelFormatter resolves status labels per active locale toolbar. Use locale toolbar to verify sq/en/uk/it."}}},render:(r,e)=>{var o,t;const a=(t=e==null||(o=e.globals)===null||o===void 0?void 0:o.locale)!==null&&t!==void 0?t:"en";return l.jsx(s,{events:[E[0]],labelFormatter:N(a)})}},c={parameters:{docs:{description:{story:"Two events. All status labels localized via labelFormatter per active locale toolbar."}}},render:(r,e)=>{var o,t;const a=(t=e==null||(o=e.globals)===null||o===void 0?void 0:o.locale)!==null&&t!==void 0?t:"en";return l.jsx(s,{events:[{id:"1",fromStatus:"open",toStatus:"in_progress",note:null,actorName:"Admin",createdAt:"2026-05-30T10:00:00Z"},{id:"2",fromStatus:"in_progress",toStatus:"resolved",note:null,actorName:"Moderator",createdAt:"2026-05-31T09:00:00Z"}],labelFormatter:N(a)})}},d={parameters:{docs:{description:{story:"@320: long actor names, notes, and status labels follow the toolbar locale. Use locale toolbar for sq/en/uk/it; viewport toolbar for widths."}}},render:(r,e)=>{var o,t;const a=(t=e==null||(o=e.globals)===null||o===void 0?void 0:o.locale)!==null&&t!==void 0?t:"en";return l.jsx(s,{events:[{id:"1",fromStatus:"open",toStatus:"in_progress",note:F("note_1",a),actorName:F("actor_1",a),createdAt:"2026-05-31T08:00:00Z"},{id:"2",fromStatus:"in_progress",toStatus:"resolved",note:null,actorName:F("actor_2",a),createdAt:"2026-06-01T10:00:00Z"}],labelFormatter:N(a)})},globals:{viewport:{value:"mobile320",isRotated:!1}}},m={parameters:{docs:{description:{story:'No labelFormatter supplied. Component must humanize snake_case keys to Title Case — never expose raw "open", "in_progress", "resolved" as user-visible text.'}}},render:()=>l.jsx(s,{events:E})};n.parameters={...n.parameters,docs:{...(p=n.parameters)===null||p===void 0?void 0:p.docs,source:{originalSource:`{
  render: () => <StatusChangeHistory events={[]} />
}`,...(v=n.parameters)===null||v===void 0||(u=v.docs)===null||u===void 0?void 0:u.source}}};i.parameters={...i.parameters,docs:{...(_=i.parameters)===null||_===void 0?void 0:_.docs,source:{originalSource:`{
  parameters: {
    docs: {
      description: {
        story: 'One event. labelFormatter resolves status labels per active locale toolbar. Use locale toolbar to verify sq/en/uk/it.'
      }
    }
  },
  render: (_, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    return <StatusChangeHistory events={[EVENTS[0]]} labelFormatter={makeFmt(locale)} />;
  }
}`,...(g=i.parameters)===null||g===void 0||(b=g.docs)===null||b===void 0?void 0:b.source}}};c.parameters={...c.parameters,docs:{...(S=c.parameters)===null||S===void 0?void 0:S.docs,source:{originalSource:`{
  parameters: {
    docs: {
      description: {
        story: 'Two events. All status labels localized via labelFormatter per active locale toolbar.'
      }
    }
  },
  render: (_, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    return <StatusChangeHistory events={[{
      id: '1',
      fromStatus: 'open',
      toStatus: 'in_progress',
      note: null,
      actorName: 'Admin',
      createdAt: '2026-05-30T10:00:00Z'
    }, {
      id: '2',
      fromStatus: 'in_progress',
      toStatus: 'resolved',
      note: null,
      actorName: 'Moderator',
      createdAt: '2026-05-31T09:00:00Z'
    }]} labelFormatter={makeFmt(locale)} />;
  }
}`,...(f=c.parameters)===null||f===void 0||(y=f.docs)===null||y===void 0?void 0:y.source}}};d.parameters={...d.parameters,docs:{...(h=d.parameters)===null||h===void 0?void 0:h.docs,source:{originalSource:`{
  parameters: {
    docs: {
      description: {
        story: '@320: long actor names, notes, and status labels follow the toolbar locale. Use locale toolbar for sq/en/uk/it; viewport toolbar for widths.'
      }
    }
  },
  render: (_, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    return <StatusChangeHistory events={[{
      id: '1',
      fromStatus: 'open',
      toStatus: 'in_progress',
      note: ah('note_1', locale),
      actorName: ah('actor_1', locale),
      createdAt: '2026-05-31T08:00:00Z'
    }, {
      id: '2',
      fromStatus: 'in_progress',
      toStatus: 'resolved',
      note: null,
      actorName: ah('actor_2', locale),
      createdAt: '2026-06-01T10:00:00Z'
    }]} labelFormatter={makeFmt(locale)} />;
  },
  globals: {
    viewport: {
      value: 'mobile320',
      isRotated: false
    }
  }
}`,...(k=d.parameters)===null||k===void 0||(w=k.docs)===null||w===void 0?void 0:w.source}}};m.parameters={...m.parameters,docs:{...(T=m.parameters)===null||T===void 0?void 0:T.docs,source:{originalSource:`{
  parameters: {
    docs: {
      description: {
        story: 'No labelFormatter supplied. Component must humanize snake_case keys to Title Case — ' + 'never expose raw "open", "in_progress", "resolved" as user-visible text.'
      }
    }
  },
  render: () => <StatusChangeHistory events={EVENTS} />
}`,...(A=m.parameters)===null||A===void 0||(x=A.docs)===null||x===void 0?void 0:x.source}}};const O=["Empty","Single","Multiple","LocaleStress","RawKeyStress"];export{n as Empty,d as LocaleStress,c as Multiple,m as RawKeyStress,i as Single,O as __namedExportsOrder,q as default};
