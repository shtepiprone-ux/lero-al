import{r as W,j as e}from"./iframe-BWqC60Cj.js";import{I as P}from"./input-ByZEYirH.js";import{B as p}from"./button-DqckHWPj.js";import{c as U}from"./utils-D5ceN5oG.js";import{B as k}from"./badge-DkqjA9o-.js";import{S as H,a as V,b as Y,c as $,d as G,f as J}from"./sheet-D01mHhYp.js";import{P as Q,S as X}from"./Section-BYOSBbVU.js";import{s as Z}from"./_storyI18n-DUPbxmag.js";import"./preload-helper-Dp1pzeXC.js";import"./useControlled-COCwHvrc.js";import"./useIsoLayoutEffect-BlzvCgLy.js";import"./useRenderElement-DCWLj8DQ.js";import"./shadowDom-KUr5fxLu.js";import"./useRegisterFieldControl-DQI04whl.js";import"./useLabelableId-DofIhODs.js";import"./createBaseUIEventDetails-urpO65QN.js";import"./index-D4MQtXW4.js";import"./useButton-62N7Qls-.js";import"./index-PXfbuUw3.js";import"./x-oNeZx8ai.js";import"./createLucideIcon-DZTr3VOw.js";import"./DialogTrigger-B5XcOvoT.js";import"./useInteractions-CUNok2Pe.js";import"./useTransitionStatus-C523vQjG.js";import"./inertValue-DeE1CYDS.js";import"./visuallyHidden-COI6QeQH.js";import"./index-DTzEXCUc.js";import"./useOpenInteractionType-D7GLRI-3.js";import"./useValueChanged-DYbhOE3F.js";import"./useRole-BHvzd0LU.js";import"./getEmptyRootContext-CBnq-fR5.js";function O({search:r,activeFilters:t,availableFilters:s,filters:l,activeCount:o=0,onReset:n,labels:i,className:b}){const[w,u]=W.useState(!1),c=o>0,d=t!==void 0||s!==void 0,y=d?e.jsxs("div",{className:"flex flex-col gap-4",children:[t&&e.jsx("div",{className:"flex flex-wrap gap-2",children:t}),s&&e.jsx("div",{className:"flex flex-wrap gap-2",children:s})]}):l;return e.jsxs("div",{"data-testid":"filter-bar",className:U("flex flex-col gap-3",b),children:[e.jsxs("div",{className:"flex flex-col gap-3 sm:flex-row sm:items-center [&>*]:max-sm:w-full",children:[e.jsxs(H,{open:w,onOpenChange:u,children:[e.jsxs(V,{render:e.jsx(p,{size:"xl",variant:"outline",className:"gap-2 lg:hidden"}),children:[i.filters,c&&e.jsx(k,{variant:"secondary",className:"shrink-0",children:o})]}),e.jsxs(Y,{side:"left",children:[e.jsx($,{children:e.jsx(G,{children:i.filters})}),e.jsx("div",{className:"flex-1 overflow-y-auto",children:y}),c&&e.jsx(J,{children:e.jsx(p,{size:"xl",variant:"ghost",className:"w-full",onClick:()=>{n==null||n(),u(!1)},children:i.reset})})]})]}),r&&e.jsx("div",{className:"min-w-0 w-full sm:flex-1 lg:flex-none lg:w-full",children:r})]}),d&&(t||c)&&e.jsxs("div",{className:"hidden lg:flex lg:flex-wrap lg:items-center lg:gap-2",children:[t,c&&e.jsxs("span",{className:"inline-flex items-center gap-2 shrink-0",children:[e.jsx(k,{variant:"secondary",className:"shrink-0",children:o}),e.jsx(p,{size:"xl",variant:"ghost",onClick:n,className:"shrink-0",children:i.reset})]})]}),d&&s&&e.jsx("div",{className:"hidden lg:flex lg:flex-wrap lg:gap-2",children:s}),!d&&l&&e.jsxs("div",{className:"hidden lg:flex lg:flex-wrap lg:items-start lg:gap-2",children:[l,c&&e.jsxs("span",{className:"inline-flex items-center gap-2 shrink-0 lg:self-center",children:[e.jsx(k,{variant:"secondary",className:"shrink-0",children:o}),e.jsx(p,{size:"xl",variant:"ghost",onClick:n,className:"shrink-0",children:i.reset})]})]})]})}O.__docgenInfo={description:"",methods:[],displayName:"FilterBar",props:{search:{required:!1,tsType:{name:"ReactNode"},description:`Slot A — search row (top, full content width at all breakpoints).
Required by the canonical desktop hierarchy (AC1).`},activeFilters:{required:!1,tsType:{name:"ReactNode"},description:`Slot B — currently-applied filter chips.
Desktop (≥1024): row 2, grouped with count Badge + Reset (AC2/AC3).
<1024: rendered inside the Sheet (section 1).`},availableFilters:{required:!1,tsType:{name:"ReactNode"},description:`Slot C — available / refinement filter controls.
Desktop (≥1024): row 3 (AC2).
<1024: rendered inside the Sheet (section 2).`},filters:{required:!1,tsType:{name:"ReactNode"},description:`Legacy single-slot (used when activeFilters/availableFilters are not provided).
Desktop (≥1024): rendered inline (old behavior).
<1024: rendered inside the Sheet.`},activeCount:{required:!1,tsType:{name:"number"},description:"",defaultValue:{value:"0",computed:!1}},onReset:{required:!1,tsType:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}}},description:""},labels:{required:!0,tsType:{name:"signature",type:"object",raw:`{
  filters: string
  reset: string
  close?: string
}`,signature:{properties:[{key:"filters",value:{name:"string",required:!0}},{key:"reset",value:{name:"string",required:!0}},{key:"close",value:{name:"string",required:!1}}]}},description:""},className:{required:!1,tsType:{name:"string"},description:""}}};var R,N,S,C,F,A,T,D,B,q,L,z,M,E,I;const qe={title:"Layout/FilterBar",component:O,tags:["autodocs"],parameters:{layout:"fullscreen",docs:{description:{component:"Tier-2 global layout primitive (CLIENT component — owns Sheet open-state). Canonical filter/search/reset row per docs/design-system.md §11.1. Desktop (≥1024): Row 1 = search (full width) → Row 2 = activeFilters + count + Reset → Row 3 = availableFilters. Tablet (640–1023): Sheet trigger + search inline; filters collapse to Sheet. Mobile (<640): Sheet trigger + search stacked full-width; Sheet for filters. Labels via `labels` prop only — zero literal strings. (Task 374 slot model: search · activeFilters · availableFilters · legacy filters)"}}}},v=(r,t="en")=>Z(t,`storybook.filterbar.${r}`),ee=["chip_sale","chip_rent","chip_commercial","chip_studio","chip_2br","chip_3br","chip_4br","chip_5br","chip_6plus","chip_office","chip_land"];function te(r){return{filters:v("filters",r),reset:v("reset",r),close:v("close",r)}}function se({placeholder:r}){return e.jsx(P,{placeholder:r,type:"search",className:"h-11"})}function m({locale:r="en",totalChips:t=6,initialActiveCount:s=0}){const l=ee.slice(0,t).map(a=>({key:a,label:v(a,r)})),[o,n]=W.useState(()=>l.slice(0,s).map(a=>a.key)),i=l.filter(a=>o.includes(a.key)),b=l.filter(a=>!o.includes(a.key)),w=te(r),u=v("section_title",r),c=v("search_ph",r);function d(a){n(j=>j.includes(a)?j.filter(K=>K!==a):[...j,a])}const y=e.jsx("div",{className:"rounded-2xl border bg-card overflow-hidden",children:[0,1].map(a=>e.jsxs("div",{className:"flex items-center gap-3 px-4 py-3 border-b last:border-b-0",children:[e.jsx("div",{className:"h-9 w-9 rounded-full bg-muted shrink-0"}),e.jsxs("div",{className:"flex-1 space-y-1.5 min-w-0",children:[e.jsx("div",{className:"h-3.5 bg-muted rounded-full w-2/3"}),e.jsx("div",{className:"h-2.5 bg-muted/60 rounded-full w-1/2"})]}),e.jsx("div",{className:"h-5 w-14 rounded-full bg-muted shrink-0"})]},a))});return e.jsx(Q,{children:e.jsxs("div",{className:"space-y-6",children:[e.jsx(O,{search:e.jsx(se,{placeholder:c}),activeFilters:i.length>0?e.jsx(e.Fragment,{children:i.map(a=>e.jsx(p,{size:"xl",variant:"default",onClick:()=>d(a.key),children:a.label},a.key))}):void 0,availableFilters:e.jsx(e.Fragment,{children:b.map(a=>e.jsx(p,{size:"xl",variant:"outline",onClick:()=>d(a.key),children:a.label},a.key))}),activeCount:i.length,onReset:i.length>0?()=>n([]):void 0,labels:w}),e.jsx(X,{title:u,children:y})]})})}const h={parameters:{docs:{description:{story:"Desktop ≥1024: Row 1 = search full-width · Row 2 = active chips + count + Reset · Row 3 = available filters. 2 pre-active. Use locale toolbar — chips, labels, search placeholder all update."}}},render:(r,t)=>{var s,l;const o=(l=t==null||(s=t.globals)===null||s===void 0?void 0:s.locale)!==null&&l!==void 0?l:"en";return e.jsx(m,{locale:o,totalChips:5,initialActiveCount:2})},globals:{viewport:{value:"desktop1440",isRotated:!1}}},g={parameters:{docs:{description:{story:"0 active: no count, no Reset. Row 3 = available filters only. Click any filter → it moves to Row 2 active."}}},render:(r,t)=>{var s,l;const o=(l=t==null||(s=t.globals)===null||s===void 0?void 0:s.locale)!==null&&l!==void 0?l:"en";return e.jsx(m,{locale:o,totalChips:5,initialActiveCount:0})},globals:{viewport:{value:"desktop1440",isRotated:!1}}},f={parameters:{docs:{description:{story:"3 of 6 pre-active. Row 2 = active + count(3) + Reset. Row 3 = available. Reset clears all → Row 2 empties, everything moves to Row 3."}}},render:(r,t)=>{var s,l;const o=(l=t==null||(s=t.globals)===null||s===void 0?void 0:s.locale)!==null&&l!==void 0?l:"en";return e.jsx(m,{locale:o,totalChips:6,initialActiveCount:3})},globals:{viewport:{value:"desktop1440",isRotated:!1}}},x={parameters:{docs:{description:{story:"uk@320: longest-locale stress. Sheet trigger + search full-width at 320. Ukrainian labels wrap in Sheet. No h-scroll."}}},render:(r,t)=>{var s,l;const o=(l=t==null||(s=t.globals)===null||s===void 0?void 0:s.locale)!==null&&l!==void 0?l:"en";return e.jsx(m,{locale:o,totalChips:5,initialActiveCount:3})},globals:{viewport:{value:"mobile320",isRotated:!1}}},_={parameters:{docs:{description:{story:"11 chips: at ≥1024 active row wraps correctly; available row wraps. Reset + count always adjacent to active row."}}},render:(r,t)=>{var s,l;const o=(l=t==null||(s=t.globals)===null||s===void 0?void 0:s.locale)!==null&&l!==void 0?l:"en";return e.jsx(m,{locale:o,totalChips:11,initialActiveCount:3})},globals:{viewport:{value:"desktop1440",isRotated:!1}}};h.parameters={...h.parameters,docs:{...(R=h.parameters)===null||R===void 0?void 0:R.docs,source:{originalSource:`{
  parameters: {
    docs: {
      description: {
        story: 'Desktop ≥1024: Row 1 = search full-width · Row 2 = active chips + count + Reset · Row 3 = available filters. 2 pre-active. Use locale toolbar — chips, labels, search placeholder all update.'
      }
    }
  },
  render: (_, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    return <FilterBarDemo locale={locale} totalChips={5} initialActiveCount={2} />;
  },
  globals: {
    viewport: {
      value: 'desktop1440',
      isRotated: false
    }
  }
}`,...(S=h.parameters)===null||S===void 0||(N=S.docs)===null||N===void 0?void 0:N.source}}};g.parameters={...g.parameters,docs:{...(C=g.parameters)===null||C===void 0?void 0:C.docs,source:{originalSource:`{
  parameters: {
    docs: {
      description: {
        story: '0 active: no count, no Reset. Row 3 = available filters only. Click any filter → it moves to Row 2 active.'
      }
    }
  },
  render: (_, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    return <FilterBarDemo locale={locale} totalChips={5} initialActiveCount={0} />;
  },
  globals: {
    viewport: {
      value: 'desktop1440',
      isRotated: false
    }
  }
}`,...(A=g.parameters)===null||A===void 0||(F=A.docs)===null||F===void 0?void 0:F.source}}};f.parameters={...f.parameters,docs:{...(T=f.parameters)===null||T===void 0?void 0:T.docs,source:{originalSource:`{
  parameters: {
    docs: {
      description: {
        story: '3 of 6 pre-active. Row 2 = active + count(3) + Reset. Row 3 = available. Reset clears all → Row 2 empties, everything moves to Row 3.'
      }
    }
  },
  render: (_, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    return <FilterBarDemo locale={locale} totalChips={6} initialActiveCount={3} />;
  },
  globals: {
    viewport: {
      value: 'desktop1440',
      isRotated: false
    }
  }
}`,...(B=f.parameters)===null||B===void 0||(D=B.docs)===null||D===void 0?void 0:D.source}}};x.parameters={...x.parameters,docs:{...(q=x.parameters)===null||q===void 0?void 0:q.docs,source:{originalSource:`{
  parameters: {
    docs: {
      description: {
        story: 'uk@320: longest-locale stress. Sheet trigger + search full-width at 320. Ukrainian labels wrap in Sheet. No h-scroll.'
      }
    }
  },
  render: (_, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    return <FilterBarDemo locale={locale} totalChips={5} initialActiveCount={3} />;
  },
  globals: {
    viewport: {
      value: 'mobile320',
      isRotated: false
    }
  }
}`,...(z=x.parameters)===null||z===void 0||(L=z.docs)===null||L===void 0?void 0:L.source}}};_.parameters={..._.parameters,docs:{...(M=_.parameters)===null||M===void 0?void 0:M.docs,source:{originalSource:`{
  parameters: {
    docs: {
      description: {
        story: '11 chips: at ≥1024 active row wraps correctly; available row wraps. Reset + count always adjacent to active row.'
      }
    }
  },
  render: (_, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    return <FilterBarDemo locale={locale} totalChips={11} initialActiveCount={3} />;
  },
  globals: {
    viewport: {
      value: 'desktop1440',
      isRotated: false
    }
  }
}`,...(I=_.parameters)===null||I===void 0||(E=I.docs)===null||E===void 0?void 0:E.source}}};const Le=["Default","NoActiveFilters","WithActiveFilters","LocaleStress","ManyFilters"];export{h as Default,x as LocaleStress,_ as ManyFilters,g as NoActiveFilters,f as WithActiveFilters,Le as __namedExportsOrder,qe as default};
