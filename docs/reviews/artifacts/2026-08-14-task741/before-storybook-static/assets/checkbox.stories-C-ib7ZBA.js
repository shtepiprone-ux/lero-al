import{j as s}from"./iframe-BWqC60Cj.js";import{C as i}from"./checkbox-6YYI4Xke.js";import{s as y}from"./_storyI18n-DUPbxmag.js";import"./preload-helper-Dp1pzeXC.js";import"./utils-D5ceN5oG.js";import"./check-BHCgvXo2.js";import"./createLucideIcon-DZTr3VOw.js";import"./useRenderElement-DCWLj8DQ.js";import"./useControlled-COCwHvrc.js";import"./useIsoLayoutEffect-BlzvCgLy.js";import"./visuallyHidden-COI6QeQH.js";import"./useRegisterFieldControl-DQI04whl.js";import"./createBaseUIEventDetails-urpO65QN.js";import"./useButton-62N7Qls-.js";import"./FormContext-D2nfdNWL.js";import"./useAriaLabelledBy-B6lK97cS.js";import"./useValueChanged-DYbhOE3F.js";import"./useTransitionStatus-C523vQjG.js";var v,u,x,b,_,h,g,k,f,C,N,j;const J={title:"Primitives/Checkbox",component:i,tags:["autodocs"],parameters:{}},o=(t,e="en")=>y(e,`storybook.checkbox.${t}`),d={render:(t,e)=>{var l,a;const r=(a=e==null||(l=e.globals)===null||l===void 0?void 0:l.locale)!==null&&a!==void 0?a:"en";return s.jsxs("div",{className:"flex items-center gap-2",children:[s.jsx(i,{id:"example"}),s.jsx("label",{htmlFor:"example",className:"text-sm",children:o("agree",r)})]})}},n={render:(t,e)=>{var l,a;const r=(a=e==null||(l=e.globals)===null||l===void 0?void 0:l.locale)!==null&&a!==void 0?a:"en";return s.jsxs("div",{className:"flex items-center gap-2",children:[s.jsx(i,{id:"checked",defaultChecked:!0}),s.jsx("label",{htmlFor:"checked",className:"text-sm",children:o("save_search",r)})]})}},m={render:(t,e)=>{var l,a;const r=(a=e==null||(l=e.globals)===null||l===void 0?void 0:l.locale)!==null&&a!==void 0?a:"en";return s.jsxs("div",{className:"flex items-center gap-2",children:[s.jsx(i,{id:"disabled",disabled:!0}),s.jsx("label",{htmlFor:"disabled",className:"text-sm text-muted-foreground",children:o("unavail",r)})]})}},p={render:(t,e)=>{var l,a;const r=(a=e==null||(l=e.globals)===null||l===void 0?void 0:l.locale)!==null&&a!==void 0?a:"en",F=[o("apartment",r),o("house",r),o("studio",r),o("villa",r),o("land",r)];return s.jsx("div",{className:"space-y-2 w-48",children:F.map(c=>s.jsxs("div",{className:"flex items-center gap-2 min-h-[44px]",children:[s.jsx(i,{id:c}),s.jsx("label",{htmlFor:c,className:"text-sm cursor-pointer",children:c})]},c))})},parameters:{docs:{description:{story:"Filter checkboxes with min-h-[44px] touch targets. Use locale toolbar for sq/en/uk/it."}}},globals:{viewport:{value:"mobile375",isRotated:!1}}};d.parameters={...d.parameters,docs:{...(v=d.parameters)===null||v===void 0?void 0:v.docs,source:{originalSource:`{
  render: (_, context) => {
    const l = context?.globals?.locale as string ?? 'en';
    return <div className="flex items-center gap-2">\r
        <Checkbox id="example" />\r
        <label htmlFor="example" className="text-sm">{ck('agree', l)}</label>\r
      </div>;
  }
}`,...(x=d.parameters)===null||x===void 0||(u=x.docs)===null||u===void 0?void 0:u.source}}};n.parameters={...n.parameters,docs:{...(b=n.parameters)===null||b===void 0?void 0:b.docs,source:{originalSource:`{
  render: (_, context) => {
    const l = context?.globals?.locale as string ?? 'en';
    return <div className="flex items-center gap-2">\r
        <Checkbox id="checked" defaultChecked />\r
        <label htmlFor="checked" className="text-sm">{ck('save_search', l)}</label>\r
      </div>;
  }
}`,...(h=n.parameters)===null||h===void 0||(_=h.docs)===null||_===void 0?void 0:_.source}}};m.parameters={...m.parameters,docs:{...(g=m.parameters)===null||g===void 0?void 0:g.docs,source:{originalSource:`{
  render: (_, context) => {
    const l = context?.globals?.locale as string ?? 'en';
    return <div className="flex items-center gap-2">\r
        <Checkbox id="disabled" disabled />\r
        <label htmlFor="disabled" className="text-sm text-muted-foreground">{ck('unavail', l)}</label>\r
      </div>;
  }
}`,...(f=m.parameters)===null||f===void 0||(k=f.docs)===null||k===void 0?void 0:k.source}}};p.parameters={...p.parameters,docs:{...(C=p.parameters)===null||C===void 0?void 0:C.docs,source:{originalSource:`{
  render: (_, context) => {
    const l = context?.globals?.locale as string ?? 'en';
    const types = [ck('apartment', l), ck('house', l), ck('studio', l), ck('villa', l), ck('land', l)];
    return <div className="space-y-2 w-48">\r
        {types.map(type => <div key={type} className="flex items-center gap-2 min-h-[44px]">\r
            <Checkbox id={type} />\r
            <label htmlFor={type} className="text-sm cursor-pointer">{type}</label>\r
          </div>)}\r
      </div>;
  },
  parameters: {
    docs: {
      description: {
        story: 'Filter checkboxes with min-h-[44px] touch targets. Use locale toolbar for sq/en/uk/it.'
      }
    }
  },
  globals: {
    viewport: {
      value: 'mobile375',
      isRotated: false
    }
  }
}`,...(j=p.parameters)===null||j===void 0||(N=j.docs)===null||N===void 0?void 0:N.source}}};const K=["Default","Checked","Disabled","FilterCheckboxList"];export{n as Checked,d as Default,m as Disabled,p as FilterCheckboxList,K as __namedExportsOrder,J as default};
