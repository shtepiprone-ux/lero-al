import{j as r,r as Y}from"./iframe-BWqC60Cj.js";import{C as D}from"./Combobox-C_XJsO5V.js";import{s as q}from"./_storyI18n-DUPbxmag.js";import"./preload-helper-Dp1pzeXC.js";import"./utils-D5ceN5oG.js";import"./mobile-bottom-sheet-tha1BKbV.js";import"./index-PXfbuUw3.js";import"./check-BHCgvXo2.js";import"./createLucideIcon-DZTr3VOw.js";import"./chevron-down-B9O36-Ph.js";var m,g,x,h,w,f,S,N,V,I,O,C,L,j,k,y,R,T;const W={title:"Shared/Combobox",component:D,tags:["autodocs"],parameters:{docs:{description:{component:"Canonical searchable/button combobox. variant=input for long lists; variant=button for short lists. Breakpoints via viewport toolbar; locales via locale toolbar."}}}},s=(l,o="en")=>q(o,`storybook.combobox.${l}`),_=[{value:"tirana",label:"Tirana"},{value:"durres",label:"Durrës"},{value:"vlore",label:"Vlorë"},{value:"shkoder",label:"Shkodër"}];function U(l){return[{value:"new",label:s("status_0",l)},{value:"in_progress",label:s("status_1",l)},{value:"resolved",label:s("status_2",l)},{value:"closed",label:s("status_3",l)}]}function E(l){return[{value:"c1",label:s("loc_0",l)},{value:"c2",label:s("loc_1",l)},{value:"c3",label:s("loc_2",l)},{value:"c4",label:s("loc_3",l)}]}function i({options:l,initialValue:o="",variant:e,placeholder:a,disabled:t,defaultOpen:n}){const[B,P]=Y.useState(o);return r.jsx(D,{options:l,value:B,onChange:P,variant:e,placeholder:a,disabled:t,defaultOpen:n})}const c={render:(l,o)=>{var e,a;const t=(a=o==null||(e=o.globals)===null||e===void 0?void 0:e.locale)!==null&&a!==void 0?a:"en";return r.jsx("div",{className:"p-4 sm:max-w-xs",children:r.jsx(i,{options:_,initialValue:"tirana",variant:"button",placeholder:s("city_ph",t)})})},globals:{viewport:{value:"desktop1280",isRotated:!1}}},d={render:(l,o)=>{var e,a;const t=(a=o==null||(e=o.globals)===null||e===void 0?void 0:e.locale)!==null&&a!==void 0?a:"en";return r.jsx("div",{className:"p-4 sm:max-w-xs",children:r.jsx(i,{options:_,initialValue:"",variant:"input",placeholder:s("city_search",t)})})},globals:{viewport:{value:"desktop1280",isRotated:!1}}},p={parameters:{docs:{description:{story:"@320: long label truncated in trigger. Select an option — value updates immediately. No horizontal overflow. Use locale toolbar for sq/en/uk/it."}}},render:(l,o)=>{var e,a;const t=(a=o==null||(e=o.globals)===null||e===void 0?void 0:e.locale)!==null&&a!==void 0?a:"en",n=U(t);return r.jsx("div",{className:"p-4",children:r.jsx(i,{options:n,initialValue:"in_progress",variant:"button",placeholder:s("status_ph",t)})})},globals:{viewport:{value:"mobile320",isRotated:!1}}},u={parameters:{docs:{description:{story:"@320: open the dropdown — long option labels wrap within dropdown bounds. Use locale toolbar for sq/en/uk/it."}}},render:(l,o)=>{var e,a;const t=(a=o==null||(e=o.globals)===null||e===void 0?void 0:e.locale)!==null&&a!==void 0?a:"en",n=E(t);return r.jsx("div",{className:"p-4",children:r.jsx(i,{options:n,initialValue:"",variant:"input",placeholder:s("search_short",t),defaultOpen:!0})})},globals:{viewport:{value:"mobile320",isRotated:!1}}},v={render:(l,o)=>{var e,a;const t=(a=o==null||(e=o.globals)===null||e===void 0?void 0:e.locale)!==null&&a!==void 0?a:"en";return r.jsx("div",{className:"p-4",children:r.jsx(i,{options:_,initialValue:"",variant:"button",placeholder:s("no_sel",t)})})},globals:{viewport:{value:"mobile320",isRotated:!1}}},b={render:(l,o)=>{var e,a;const t=(a=o==null||(e=o.globals)===null||e===void 0?void 0:e.locale)!==null&&a!==void 0?a:"en";return r.jsx("div",{className:"p-4 sm:max-w-xs",children:r.jsx(i,{options:_,initialValue:"tirana",variant:"button",placeholder:s("city_ph",t),disabled:!0})})},globals:{viewport:{value:"desktop1280",isRotated:!1}}};c.parameters={...c.parameters,docs:{...(m=c.parameters)===null||m===void 0?void 0:m.docs,source:{originalSource:`{
  render: (_, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    return <div className="p-4 sm:max-w-xs"><ComboboxInteractive options={CITY_OPTIONS} initialValue="tirana" variant="button" placeholder={cb('city_ph', locale)} /></div>;
  },
  globals: {
    viewport: {
      value: 'desktop1280',
      isRotated: false
    }
  }
}`,...(x=c.parameters)===null||x===void 0||(g=x.docs)===null||g===void 0?void 0:g.source}}};d.parameters={...d.parameters,docs:{...(h=d.parameters)===null||h===void 0?void 0:h.docs,source:{originalSource:`{
  render: (_, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    return <div className="p-4 sm:max-w-xs"><ComboboxInteractive options={CITY_OPTIONS} initialValue="" variant="input" placeholder={cb('city_search', locale)} /></div>;
  },
  globals: {
    viewport: {
      value: 'desktop1280',
      isRotated: false
    }
  }
}`,...(f=d.parameters)===null||f===void 0||(w=f.docs)===null||w===void 0?void 0:w.source}}};p.parameters={...p.parameters,docs:{...(S=p.parameters)===null||S===void 0?void 0:S.docs,source:{originalSource:`{
  parameters: {
    docs: {
      description: {
        story: '@320: long label truncated in trigger. Select an option — value updates immediately. No horizontal overflow. Use locale toolbar for sq/en/uk/it.'
      }
    }
  },
  render: (_, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    const options = getStatusOptions(locale);
    return <div className="p-4"><ComboboxInteractive options={options} initialValue="in_progress" variant="button" placeholder={cb('status_ph', locale)} /></div>;
  },
  globals: {
    viewport: {
      value: 'mobile320',
      isRotated: false
    }
  }
}`,...(V=p.parameters)===null||V===void 0||(N=V.docs)===null||N===void 0?void 0:N.source}}};u.parameters={...u.parameters,docs:{...(I=u.parameters)===null||I===void 0?void 0:I.docs,source:{originalSource:`{
  parameters: {
    docs: {
      description: {
        story: '@320: open the dropdown — long option labels wrap within dropdown bounds. Use locale toolbar for sq/en/uk/it.'
      }
    }
  },
  render: (_, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    const options = getLocationOptions(locale);
    return <div className="p-4"><ComboboxInteractive options={options} initialValue="" variant="input" placeholder={cb('search_short', locale)} defaultOpen /></div>;
  },
  globals: {
    viewport: {
      value: 'mobile320',
      isRotated: false
    }
  }
}`,...(C=u.parameters)===null||C===void 0||(O=C.docs)===null||O===void 0?void 0:O.source}}};v.parameters={...v.parameters,docs:{...(L=v.parameters)===null||L===void 0?void 0:L.docs,source:{originalSource:`{
  render: (_, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    return <div className="p-4"><ComboboxInteractive options={CITY_OPTIONS} initialValue="" variant="button" placeholder={cb('no_sel', locale)} /></div>;
  },
  globals: {
    viewport: {
      value: 'mobile320',
      isRotated: false
    }
  }
}`,...(k=v.parameters)===null||k===void 0||(j=k.docs)===null||j===void 0?void 0:j.source}}};b.parameters={...b.parameters,docs:{...(y=b.parameters)===null||y===void 0?void 0:y.docs,source:{originalSource:`{
  render: (_, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    return <div className="p-4 sm:max-w-xs"><ComboboxInteractive options={CITY_OPTIONS} initialValue="tirana" variant="button" placeholder={cb('city_ph', locale)} disabled /></div>;
  },
  globals: {
    viewport: {
      value: 'desktop1280',
      isRotated: false
    }
  }
}`,...(T=b.parameters)===null||T===void 0||(R=T.docs)===null||R===void 0?void 0:R.source}}};const X=["ButtonVariant","InputVariant","LongLabelLocaleStress","DropdownOpen","NoSelection","Disabled"];export{c as ButtonVariant,b as Disabled,u as DropdownOpen,d as InputVariant,p as LongLabelLocaleStress,v as NoSelection,X as __namedExportsOrder,W as default};
