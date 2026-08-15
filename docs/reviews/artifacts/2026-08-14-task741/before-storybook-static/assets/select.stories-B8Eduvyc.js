import{j as e}from"./iframe-BWqC60Cj.js";import{S as d,a as u,b as m,c as v,d as p}from"./select-B9nZDQIf.js";import{s as $}from"./_storyI18n-DUPbxmag.js";import"./preload-helper-Dp1pzeXC.js";import"./utils-D5ceN5oG.js";import"./mobile-bottom-sheet-tha1BKbV.js";import"./chevron-down-B9O36-Ph.js";import"./createLucideIcon-DZTr3VOw.js";import"./check-BHCgvXo2.js";import"./chevron-up-PGi9aC18.js";import"./visuallyHidden-COI6QeQH.js";import"./useRenderElement-DCWLj8DQ.js";import"./useOpenInteractionType-D7GLRI-3.js";import"./useInteractions-CUNok2Pe.js";import"./useTransitionStatus-C523vQjG.js";import"./useIsoLayoutEffect-BlzvCgLy.js";import"./createBaseUIEventDetails-urpO65QN.js";import"./inertValue-DeE1CYDS.js";import"./shadowDom-KUr5fxLu.js";import"./index-DTzEXCUc.js";import"./useValueChanged-DYbhOE3F.js";import"./useControlled-COCwHvrc.js";import"./useRegisterFieldControl-DQI04whl.js";import"./useLabelableId-DofIhODs.js";import"./FormContext-D2nfdNWL.js";import"./usePositioner-6ZAe_XXl.js";import"./DirectionContext-CtLbILH8.js";import"./getPseudoElementBounds-DoZBSa7U.js";import"./useButton-62N7Qls-.js";import"./CompositeList-S6-dMJcD.js";import"./useAnchoredPopupScrollLock-B9Vs29W1.js";var w,j,I,T,y,k,C,V,N,L,R,M,D,E,O,Y,q,z,B,U,A;const je={title:"Primitives/Select",tags:["autodocs"],parameters:{docs:{description:{component:"Base-UI Select primitive. **Canonical usage:** always pass `items` to `<Select>` (= `SelectRoot`) so the trigger can resolve value→label without requiring the dropdown to open first. `items` shape: `Array<{ value: string; label: string }>`. SelectTrigger uses w-full max-w-full min-w-0 so it fills its container without horizontal overflow. SelectItem text uses break-words — long labels wrap inside the dropdown. Breakpoints verified via the Storybook viewport toolbar; locales via the locale toolbar."}}}},i=(r,l="en")=>$(l,`storybook.select.${r}`),n=[{value:"tirana",label:"Tirana"},{value:"durres",label:"Durrës"},{value:"vlore",label:"Vlorë"},{value:"shkoder",label:"Shkodër"}];function P(r){return[{value:"new",label:i("status_0",r)},{value:"in_progress",label:i("status_1",r)},{value:"resolved",label:i("status_2",r)},{value:"closed",label:i("status_3",r)}]}function F(r){return{placeholder:i("city_ph",r),cities:[{value:"tirana",label:i("city_tirana",r)},{value:"durres",label:i("city_durres",r)},{value:"vlore",label:i("city_vlore",r)},{value:"shkoder",label:i("city_shkoder",r)}]}}const _={render:(r,l)=>{var t,a;const s=(a=l==null||(t=l.globals)===null||t===void 0?void 0:t.locale)!==null&&a!==void 0?a:"en";return e.jsx("div",{className:"p-4 sm:max-w-xs",children:e.jsxs(d,{defaultValue:"tirana",items:n,children:[e.jsx(u,{children:e.jsx(m,{placeholder:i("city_ph",s)})}),e.jsx(v,{children:n.map(o=>e.jsx(p,{value:o.value,children:o.label},o.value))})]})})},globals:{viewport:{value:"desktop1280",isRotated:!1}}},S={render:(r,l)=>{var t,a;const s=(a=l==null||(t=l.globals)===null||t===void 0?void 0:t.locale)!==null&&a!==void 0?a:"en";return e.jsx("div",{className:"p-4 sm:max-w-xs",children:e.jsxs(d,{items:n,children:[e.jsx(u,{children:e.jsx(m,{placeholder:i("city_ph",s)})}),e.jsx(v,{children:n.map(o=>e.jsx(p,{value:o.value,children:o.label},o.value))})]})})},globals:{viewport:{value:"desktop1280",isRotated:!1}}},g={parameters:{docs:{description:{story:"@320: selected long label must be truncated in trigger — no horizontal overflow. Open dropdown: options must wrap. Use locale toolbar for sq/en/uk/it."}}},render:(r,l)=>{var t,a;const s=(a=l==null||(t=l.globals)===null||t===void 0?void 0:t.locale)!==null&&a!==void 0?a:"en",o=P(s);return e.jsx("div",{className:"p-3",children:e.jsxs(d,{defaultValue:"in_progress",items:o,children:[e.jsx(u,{children:e.jsx(m,{placeholder:i("status_ph",s)})}),e.jsx(v,{children:o.map(c=>e.jsx(p,{value:c.value,children:c.label},c.value))})]})})},globals:{viewport:{value:"mobile320",isRotated:!1}}},b={render:(r,l)=>{var t,a;const s=(a=l==null||(t=l.globals)===null||t===void 0?void 0:t.locale)!==null&&a!==void 0?a:"en";return e.jsx("div",{className:"p-4 sm:max-w-xs",children:e.jsxs(d,{defaultValue:"tirana",items:n,disabled:!0,children:[e.jsx(u,{children:e.jsx(m,{placeholder:i("city_ph",s)})}),e.jsx(v,{children:n.map(o=>e.jsx(p,{value:o.value,children:o.label},o.value))})]})})},globals:{viewport:{value:"desktop1280",isRotated:!1}}},h={render:(r,l)=>{var t,a;const s=(a=l==null||(t=l.globals)===null||t===void 0?void 0:t.locale)!==null&&a!==void 0?a:"en";return e.jsx("div",{className:"p-4 sm:max-w-xs",children:e.jsxs(d,{defaultValue:"tirana",items:n,children:[e.jsx(u,{variant:"outline",children:e.jsx(m,{placeholder:i("city_ph",s)})}),e.jsx(v,{children:n.map(o=>e.jsx(p,{value:o.value,children:o.label},o.value))})]})})},globals:{viewport:{value:"desktop1280",isRotated:!1}}},x={parameters:{docs:{description:{story:"@320: Select opens as a full-width bottom sheet — edge-to-edge, rounded-t-2xl, drag handle, slide-up. Items ≥44px. Use locale toolbar for sq/en/uk/it."}}},render:(r,l)=>{var t,a;const s=(a=l==null||(t=l.globals)===null||t===void 0?void 0:t.locale)!==null&&a!==void 0?a:"en",o=P(s);return e.jsx("div",{className:"p-3",children:e.jsxs(d,{items:o,defaultOpen:!0,children:[e.jsx(u,{children:e.jsx(m,{placeholder:i("status_ph",s)})}),e.jsx(v,{children:o.map(c=>e.jsx(p,{value:c.value,children:c.label},c.value))})]})})},globals:{viewport:{value:"mobile320",isRotated:!1}}},f={parameters:{docs:{description:{story:"Settlement names at 320px. Names are always capitalized. Use the locale toolbar to switch sq/en/uk/it — each locale shows the appropriate settlement label. Trigger value must truncate; no horizontal overflow."}}},render:(r,l)=>{var t,a;const s=(a=l==null||(t=l.globals)===null||t===void 0?void 0:t.locale)!==null&&a!==void 0?a:"en",o=F(s);return e.jsx("div",{className:"p-3",children:e.jsxs(d,{defaultValue:"tirana",items:o.cities,children:[e.jsx(u,{children:e.jsx(m,{placeholder:o.placeholder})}),e.jsx(v,{children:o.cities.map(c=>e.jsx(p,{value:c.value,children:c.label},c.value))})]})})},globals:{viewport:{value:"mobile320",isRotated:!1}}};_.parameters={..._.parameters,docs:{...(w=_.parameters)===null||w===void 0?void 0:w.docs,source:{originalSource:`{
  render: (_, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    return <div className="p-4 sm:max-w-xs">\r
        <Select defaultValue="tirana" items={CITY_ITEMS}>\r
          <SelectTrigger><SelectValue placeholder={sel('city_ph', locale)} /></SelectTrigger>\r
          <SelectContent>\r
            {CITY_ITEMS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}\r
          </SelectContent>\r
        </Select>\r
      </div>;
  },
  globals: {
    viewport: {
      value: 'desktop1280',
      isRotated: false
    }
  }
}`,...(I=_.parameters)===null||I===void 0||(j=I.docs)===null||j===void 0?void 0:j.source}}};S.parameters={...S.parameters,docs:{...(T=S.parameters)===null||T===void 0?void 0:T.docs,source:{originalSource:`{
  render: (_, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    return <div className="p-4 sm:max-w-xs">\r
        <Select items={CITY_ITEMS}>\r
          <SelectTrigger><SelectValue placeholder={sel('city_ph', locale)} /></SelectTrigger>\r
          <SelectContent>\r
            {CITY_ITEMS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}\r
          </SelectContent>\r
        </Select>\r
      </div>;
  },
  globals: {
    viewport: {
      value: 'desktop1280',
      isRotated: false
    }
  }
}`,...(k=S.parameters)===null||k===void 0||(y=k.docs)===null||y===void 0?void 0:y.source}}};g.parameters={...g.parameters,docs:{...(C=g.parameters)===null||C===void 0?void 0:C.docs,source:{originalSource:`{
  parameters: {
    docs: {
      description: {
        story: '@320: selected long label must be truncated in trigger — no horizontal overflow. Open dropdown: options must wrap. Use locale toolbar for sq/en/uk/it.'
      }
    }
  },
  render: (_, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    const items = getStatusItems(locale);
    return <div className="p-3">\r
        <Select defaultValue="in_progress" items={items}>\r
          <SelectTrigger><SelectValue placeholder={sel('status_ph', locale)} /></SelectTrigger>\r
          <SelectContent>\r
            {items.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}\r
          </SelectContent>\r
        </Select>\r
      </div>;
  },
  globals: {
    viewport: {
      value: 'mobile320',
      isRotated: false
    }
  }
}`,...(N=g.parameters)===null||N===void 0||(V=N.docs)===null||V===void 0?void 0:V.source}}};b.parameters={...b.parameters,docs:{...(L=b.parameters)===null||L===void 0?void 0:L.docs,source:{originalSource:`{
  render: (_, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    return <div className="p-4 sm:max-w-xs">\r
        <Select defaultValue="tirana" items={CITY_ITEMS} disabled>\r
          <SelectTrigger><SelectValue placeholder={sel('city_ph', locale)} /></SelectTrigger>\r
          <SelectContent>\r
            {CITY_ITEMS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}\r
          </SelectContent>\r
        </Select>\r
      </div>;
  },
  globals: {
    viewport: {
      value: 'desktop1280',
      isRotated: false
    }
  }
}`,...(M=b.parameters)===null||M===void 0||(R=M.docs)===null||R===void 0?void 0:R.source}}};h.parameters={...h.parameters,docs:{...(D=h.parameters)===null||D===void 0?void 0:D.docs,source:{originalSource:`{
  render: (_, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    return <div className="p-4 sm:max-w-xs">\r
        <Select defaultValue="tirana" items={CITY_ITEMS}>\r
          <SelectTrigger variant="outline"><SelectValue placeholder={sel('city_ph', locale)} /></SelectTrigger>\r
          <SelectContent>\r
            {CITY_ITEMS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}\r
          </SelectContent>\r
        </Select>\r
      </div>;
  },
  globals: {
    viewport: {
      value: 'desktop1280',
      isRotated: false
    }
  }
}`,...(O=h.parameters)===null||O===void 0||(E=O.docs)===null||E===void 0?void 0:E.source}}};x.parameters={...x.parameters,docs:{...(Y=x.parameters)===null||Y===void 0?void 0:Y.docs,source:{originalSource:`{
  parameters: {
    docs: {
      description: {
        story: '@320: Select opens as a full-width bottom sheet — edge-to-edge, rounded-t-2xl, drag handle, slide-up. Items ≥44px. Use locale toolbar for sq/en/uk/it.'
      }
    }
  },
  render: (_, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    const items = getStatusItems(locale);
    return <div className="p-3">\r
        <Select items={items} defaultOpen>\r
          <SelectTrigger><SelectValue placeholder={sel('status_ph', locale)} /></SelectTrigger>\r
          <SelectContent>\r
            {items.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}\r
          </SelectContent>\r
        </Select>\r
      </div>;
  },
  globals: {
    viewport: {
      value: 'mobile320',
      isRotated: false
    }
  }
}`,...(z=x.parameters)===null||z===void 0||(q=z.docs)===null||q===void 0?void 0:q.source}}};f.parameters={...f.parameters,docs:{...(B=f.parameters)===null||B===void 0?void 0:B.docs,source:{originalSource:`{
  parameters: {
    docs: {
      description: {
        story: 'Settlement names at 320px. Names are always capitalized. ' + 'Use the locale toolbar to switch sq/en/uk/it — each locale shows the appropriate settlement label. ' + 'Trigger value must truncate; no horizontal overflow.'
      }
    }
  },
  render: (_, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    const data = getSettlements(locale);
    return <div className="p-3">\r
        <Select defaultValue="tirana" items={data.cities}>\r
          <SelectTrigger><SelectValue placeholder={data.placeholder} /></SelectTrigger>\r
          <SelectContent>\r
            {data.cities.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}\r
          </SelectContent>\r
        </Select>\r
      </div>;
  },
  globals: {
    viewport: {
      value: 'mobile320',
      isRotated: false
    }
  }
}`,...(A=f.parameters)===null||A===void 0||(U=A.docs)===null||U===void 0?void 0:U.source}}};const Ie=["Default","NoSelection","LongLabelLocaleStress","Disabled","OutlineVariant","MobileBottomSheet","SettlementsLocaleStress"];export{_ as Default,b as Disabled,g as LongLabelLocaleStress,x as MobileBottomSheet,S as NoSelection,h as OutlineVariant,f as SettlementsLocaleStress,Ie as __namedExportsOrder,je as default};
