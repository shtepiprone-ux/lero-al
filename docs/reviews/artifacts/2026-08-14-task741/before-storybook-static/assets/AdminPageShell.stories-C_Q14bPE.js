import{j as e,r as E}from"./iframe-BWqC60Cj.js";import{A as c}from"./AdminPageShell-BkLW3tZi.js";import{B as U}from"./button-DqckHWPj.js";import{T as I,a as J,b as Q}from"./tabs-CL8j7ACS.js";import{s as K}from"./_storyI18n-DUPbxmag.js";import{P as V}from"./plus-Cc25WxNA.js";import"./preload-helper-Dp1pzeXC.js";import"./badge-DkqjA9o-.js";import"./index-D4MQtXW4.js";import"./utils-D5ceN5oG.js";import"./useRenderElement-DCWLj8DQ.js";import"./useButton-62N7Qls-.js";import"./useIsoLayoutEffect-BlzvCgLy.js";import"./useControlled-COCwHvrc.js";import"./CompositeList-S6-dMJcD.js";import"./CompositeRoot-CMY8qbI0.js";import"./inertValue-DeE1CYDS.js";import"./shadowDom-KUr5fxLu.js";import"./DirectionContext-CtLbILH8.js";import"./createBaseUIEventDetails-urpO65QN.js";import"./useCompositeItem-D48be0U8.js";import"./useTransitionStatus-C523vQjG.js";import"./createLucideIcon-DZTr3VOw.js";var x,f,w,j,A,k,N,S,T,B,y,C,L,R,W,F,D,M,P,O,z;function X(o,l="en"){return K(l,`storybook.admin_pageshell.${o}`)}const n=(o,l="en")=>K(l,`storybook.admin_pageshell.${o}`),Ae={title:"Admin/AdminPageShell",component:c,tags:["autodocs"],parameters:{docs:{description:{component:'Canonical admin page wrapper. Provides responsive header (title + countBadge + actions), optional filter bar slot, and content area. One-shared-height contract: all action buttons in the actions slot use size="xl" (h-11 = 44px). Filter tabs in the filterBar slot use the canonical Tabs primitive from @/components/ui/tabs. At <md:, action slot becomes max-md:w-full so actions fill the column (full-width on mobile). Action buttons show in-canvas feedback when clicked. Breakpoints verified via the Storybook viewport toolbar; locales via the locale toolbar. See docs/admin-ux-rules.md (Epic HH Phase 2, Task 306).'}}}},g=e.jsxs("div",{className:"rounded-2xl border bg-card overflow-hidden",children:[e.jsxs("div",{className:"flex items-center gap-3 px-4 py-3 border-b",children:[e.jsx("div",{className:"h-9 w-9 rounded-full bg-muted shrink-0"}),e.jsxs("div",{className:"flex-1 space-y-1.5 min-w-0",children:[e.jsx("div",{className:"h-3.5 bg-muted rounded-full w-2/3"}),e.jsx("div",{className:"h-2.5 bg-muted/60 rounded-full w-1/2"})]}),e.jsx("div",{className:"h-5 w-14 rounded-full bg-muted shrink-0"})]}),e.jsxs("div",{className:"flex items-center gap-3 px-4 py-3 border-b",children:[e.jsx("div",{className:"h-9 w-9 rounded-full bg-muted shrink-0"}),e.jsxs("div",{className:"flex-1 space-y-1.5 min-w-0",children:[e.jsx("div",{className:"h-3.5 bg-muted rounded-full w-3/4"}),e.jsx("div",{className:"h-2.5 bg-muted/60 rounded-full w-2/5"})]}),e.jsx("div",{className:"h-5 w-14 rounded-full bg-muted shrink-0"})]}),e.jsxs("div",{className:"flex items-center gap-3 px-4 py-3",children:[e.jsx("div",{className:"h-9 w-9 rounded-full bg-muted shrink-0"}),e.jsxs("div",{className:"flex-1 space-y-1.5 min-w-0",children:[e.jsx("div",{className:"h-3.5 bg-muted rounded-full w-1/2"}),e.jsx("div",{className:"h-2.5 bg-muted/60 rounded-full w-3/5"})]}),e.jsx("div",{className:"h-5 w-14 rounded-full bg-muted shrink-0"})]})]});function Y(o){return[{value:"all",label:n("tab_all",o)},{value:"active",label:n("tab_active",o)},{value:"pending",label:n("tab_pending",o)}]}function $({locale:o="en"}){var l;const t=Y(o);var a;const[s,i]=E.useState((a=(l=t[0])===null||l===void 0?void 0:l.value)!==null&&a!==void 0?a:"all");return e.jsx(I,{value:s,onValueChange:r=>r&&i(r),children:e.jsx(J,{children:t.map(r=>e.jsx(Q,{value:r.value,children:r.label},r.value))})})}function q({label:o,locale:l="en"}){return e.jsxs("div",{className:"mt-3 flex items-center gap-2 px-4 py-2 rounded-lg border bg-muted/40 text-sm",children:[e.jsx("span",{className:"h-1.5 w-1.5 rounded-full bg-primary shrink-0"}),e.jsxs("span",{className:"text-muted-foreground",children:[X("action",l),": "]}),e.jsx("strong",{children:o})]})}function h({title:o,subtitle:l,countBadge:t,actionLabel:a,locale:s="en",showFilterBar:i=!1,showActions:r=!0}){const[H,G]=E.useState(null);return e.jsxs("div",{children:[e.jsx(c,{title:o,subtitle:l,countBadge:t,actions:r?e.jsxs(U,{size:"xl",onClick:()=>G(a),children:[e.jsx(V,{}),a]}):void 0,filterBar:i?e.jsx($,{locale:s}):void 0,children:g}),H&&e.jsx(q,{label:H,locale:s})]})}function Z({title:o,countBadge:l,actions:t}){const[a,s]=E.useState(null);return e.jsxs("div",{children:[e.jsx(c,{title:o,countBadge:l,actions:e.jsx(e.Fragment,{children:t.map(({label:i,variant:r="default"})=>e.jsx(U,{size:"xl",variant:r,onClick:()=>s(i),children:i==="New listing"||i==="New user"?e.jsxs(e.Fragment,{children:[e.jsx(V,{}),i]}):i},i))}),children:g}),a&&e.jsx(q,{label:a})]})}const d={render:(o,l)=>{var t,a;const s=(a=l==null||(t=l.globals)===null||t===void 0?void 0:t.locale)!==null&&a!==void 0?a:"en";return e.jsx(c,{title:n("title_listings",s),countBadge:{value:127},children:g})},globals:{viewport:{value:"desktop1440",isRotated:!1}}},u={parameters:{docs:{description:{story:"Canonical Tabs primitive in filterBar slot. Click tabs to switch active state."}}},render:(o,l)=>{var t,a;const s=(a=l==null||(t=l.globals)===null||t===void 0?void 0:t.locale)!==null&&a!==void 0?a:"en";return e.jsx(h,{title:n("title_listings",s),countBadge:{value:127},actionLabel:n("act_new_listing",s),locale:s,showFilterBar:!0,showActions:!1})},globals:{viewport:{value:"desktop1440",isRotated:!1}}},p={parameters:{docs:{description:{story:'Action slot: size="xl" (44px). Click button → in-canvas feedback.'}}},render:(o,l)=>{var t,a;const s=(a=l==null||(t=l.globals)===null||t===void 0?void 0:t.locale)!==null&&a!==void 0?a:"en";return e.jsx(h,{title:n("title_users",s),subtitle:n("sub_users",s),countBadge:{value:843},actionLabel:n("act_new_user",s),locale:s})},globals:{viewport:{value:"desktop1440",isRotated:!1}}},v={parameters:{docs:{description:{story:"Full pattern: title + count + actions + canonical tabs."}}},render:(o,l)=>{var t,a;const s=(a=l==null||(t=l.globals)===null||t===void 0?void 0:t.locale)!==null&&a!==void 0?a:"en";return e.jsx(h,{title:n("title_users",s),subtitle:n("sub_users",s),countBadge:{value:843},actionLabel:n("act_new_user",s),locale:s,showFilterBar:!0})},globals:{viewport:{value:"desktop1440",isRotated:!1}}},m={parameters:{docs:{description:{story:'Multiple page-level actions: all size="xl" (44px). At <md: actions stack full-width.'}}},render:(o,l)=>{var t,a;const s=(a=l==null||(t=l.globals)===null||t===void 0?void 0:t.locale)!==null&&a!==void 0?a:"en";return e.jsx(Z,{title:n("title_listings",s),countBadge:{value:243},actions:[{label:n("act_export",s),variant:"ghost"},{label:n("act_edit_sel",s),variant:"outline"},{label:n("act_new_listing",s)}]})},globals:{viewport:{value:"desktop1440",isRotated:!1}}},_={render:(o,l)=>{var t,a;const s=(a=l==null||(t=l.globals)===null||t===void 0?void 0:t.locale)!==null&&a!==void 0?a:"en";return e.jsx(c,{filterBar:e.jsx($,{locale:s}),children:g})},globals:{viewport:{value:"desktop1440",isRotated:!1}}},b={parameters:{docs:{description:{story:"uk@320: full-width action + Ukrainian canonical tabs. Use locale toolbar to switch; viewport toolbar for widths."}}},render:(o,l)=>{var t,a;const s=(a=l==null||(t=l.globals)===null||t===void 0?void 0:t.locale)!==null&&a!==void 0?a:"en";return e.jsx(h,{title:n("title_listings",s),subtitle:n("sub_users",s),countBadge:{value:127},actionLabel:n("act_new_listing",s),locale:s,showFilterBar:!0})},globals:{viewport:{value:"mobile320",isRotated:!1}}};d.parameters={...d.parameters,docs:{...(x=d.parameters)===null||x===void 0?void 0:x.docs,source:{originalSource:`{
  render: (_, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    return <AdminPageShell title={aps('title_listings', locale)} countBadge={{
      value: 127
    }}>\r
        {CONTENT_MOCK}\r
      </AdminPageShell>;
  },
  globals: {
    viewport: {
      value: 'desktop1440',
      isRotated: false
    }
  }
}`,...(w=d.parameters)===null||w===void 0||(f=w.docs)===null||f===void 0?void 0:f.source}}};u.parameters={...u.parameters,docs:{...(j=u.parameters)===null||j===void 0?void 0:j.docs,source:{originalSource:`{
  parameters: {
    docs: {
      description: {
        story: 'Canonical Tabs primitive in filterBar slot. Click tabs to switch active state.'
      }
    }
  },
  render: (_, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    return <AdminShellDemo title={aps('title_listings', locale)} countBadge={{
      value: 127
    }} actionLabel={aps('act_new_listing', locale)} locale={locale} showFilterBar showActions={false} />;
  },
  globals: {
    viewport: {
      value: 'desktop1440',
      isRotated: false
    }
  }
}`,...(k=u.parameters)===null||k===void 0||(A=k.docs)===null||A===void 0?void 0:A.source}}};p.parameters={...p.parameters,docs:{...(N=p.parameters)===null||N===void 0?void 0:N.docs,source:{originalSource:`{
  parameters: {
    docs: {
      description: {
        story: 'Action slot: size="xl" (44px). Click button → in-canvas feedback.'
      }
    }
  },
  render: (_, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    return <AdminShellDemo title={aps('title_users', locale)} subtitle={aps('sub_users', locale)} countBadge={{
      value: 843
    }} actionLabel={aps('act_new_user', locale)} locale={locale} />;
  },
  globals: {
    viewport: {
      value: 'desktop1440',
      isRotated: false
    }
  }
}`,...(T=p.parameters)===null||T===void 0||(S=T.docs)===null||S===void 0?void 0:S.source}}};v.parameters={...v.parameters,docs:{...(B=v.parameters)===null||B===void 0?void 0:B.docs,source:{originalSource:`{
  parameters: {
    docs: {
      description: {
        story: 'Full pattern: title + count + actions + canonical tabs.'
      }
    }
  },
  render: (_, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    return <AdminShellDemo title={aps('title_users', locale)} subtitle={aps('sub_users', locale)} countBadge={{
      value: 843
    }} actionLabel={aps('act_new_user', locale)} locale={locale} showFilterBar />;
  },
  globals: {
    viewport: {
      value: 'desktop1440',
      isRotated: false
    }
  }
}`,...(C=v.parameters)===null||C===void 0||(y=C.docs)===null||y===void 0?void 0:y.source}}};m.parameters={...m.parameters,docs:{...(L=m.parameters)===null||L===void 0?void 0:L.docs,source:{originalSource:`{
  parameters: {
    docs: {
      description: {
        story: 'Multiple page-level actions: all size="xl" (44px). At <md: actions stack full-width.'
      }
    }
  },
  render: (_, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    return <MultiActionShellDemo title={aps('title_listings', locale)} countBadge={{
      value: 243
    }} actions={[{
      label: aps('act_export', locale),
      variant: 'ghost'
    }, {
      label: aps('act_edit_sel', locale),
      variant: 'outline'
    }, {
      label: aps('act_new_listing', locale)
    }]} />;
  },
  globals: {
    viewport: {
      value: 'desktop1440',
      isRotated: false
    }
  }
}`,...(W=m.parameters)===null||W===void 0||(R=W.docs)===null||R===void 0?void 0:R.source}}};_.parameters={..._.parameters,docs:{...(F=_.parameters)===null||F===void 0?void 0:F.docs,source:{originalSource:`{
  render: (_, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    return <AdminPageShell filterBar={<FilterTabsCanonical locale={locale} />}>\r
        {CONTENT_MOCK}\r
      </AdminPageShell>;
  },
  globals: {
    viewport: {
      value: 'desktop1440',
      isRotated: false
    }
  }
}`,...(M=_.parameters)===null||M===void 0||(D=M.docs)===null||D===void 0?void 0:D.source}}};b.parameters={...b.parameters,docs:{...(P=b.parameters)===null||P===void 0?void 0:P.docs,source:{originalSource:`{
  parameters: {
    docs: {
      description: {
        story: 'uk@320: full-width action + Ukrainian canonical tabs. Use locale toolbar to switch; viewport toolbar for widths.'
      }
    }
  },
  render: (_, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    return <AdminShellDemo title={aps('title_listings', locale)} subtitle={aps('sub_users', locale)} countBadge={{
      value: 127
    }} actionLabel={aps('act_new_listing', locale)} locale={locale} showFilterBar />;
  },
  globals: {
    viewport: {
      value: 'mobile320',
      isRotated: false
    }
  }
}`,...(z=b.parameters)===null||z===void 0||(O=z.docs)===null||O===void 0?void 0:O.source}}};const ke=["Default","WithTabs","WithActions","WithTabsAndActions","MultipleActions","NoHeader","LocaleStress"];export{d as Default,b as LocaleStress,m as MultipleActions,_ as NoHeader,p as WithActions,u as WithTabs,v as WithTabsAndActions,ke as __namedExportsOrder,Ae as default};
