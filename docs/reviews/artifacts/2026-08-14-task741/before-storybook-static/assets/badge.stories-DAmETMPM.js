import{j as e}from"./iframe-BWqC60Cj.js";import{B as a}from"./badge-DkqjA9o-.js";import{s as N}from"./_storyI18n-DUPbxmag.js";import"./preload-helper-Dp1pzeXC.js";import"./index-D4MQtXW4.js";import"./utils-D5ceN5oG.js";import"./useRenderElement-DCWLj8DQ.js";var g,u,p,m,x,_,b,B,f,h,j,w;const D={title:"Primitives/Badge",component:a,tags:["autodocs"],parameters:{},argTypes:{variant:{control:"select",options:["default","secondary","destructive","outline","ghost","link","success","warning","info","rented","neutral"]}}},r=(l,s="en")=>N(s,`storybook.badge.${l}`),d={render:(l,s)=>{var n,i;const t=(i=s==null||(n=s.globals)===null||n===void 0?void 0:n.locale)!==null&&i!==void 0?i:"en";return e.jsx(a,{variant:"default",children:r("premium",t)})}},o={render:(l,s)=>{var n,i;const t=(i=s==null||(n=s.globals)===null||n===void 0?void 0:n.locale)!==null&&i!==void 0?i:"en";return e.jsxs("div",{className:"flex flex-wrap gap-2",children:[e.jsx(a,{variant:"default",children:r("new",t)}),e.jsx(a,{variant:"secondary",children:r("for_rent",t)}),e.jsx(a,{variant:"success",children:r("active",t)}),e.jsx(a,{variant:"warning",children:r("pending",t)}),e.jsx(a,{variant:"destructive",children:r("archived",t)}),e.jsx(a,{variant:"info",children:r("premium",t)}),e.jsx(a,{variant:"rented",children:r("rented",t)}),e.jsx(a,{variant:"outline",children:"Outline"}),e.jsx(a,{variant:"neutral",children:"Neutral"})]})}},c={render:(l,s)=>{var n,i;const t=(i=s==null||(n=s.globals)===null||n===void 0?void 0:n.locale)!==null&&i!==void 0?i:"en";return e.jsxs("div",{className:"flex flex-wrap gap-2",children:[e.jsx(a,{variant:"success",children:r("active",t)}),e.jsx(a,{variant:"warning",children:r("pending",t)}),e.jsx(a,{variant:"neutral",children:r("inactive",t)}),e.jsx(a,{variant:"destructive",children:r("archived",t)}),e.jsx(a,{variant:"rented",children:r("rented",t)})]})},parameters:{docs:{description:{story:"Canonical listing status badges. Use locale toolbar for sq/en/uk/it."}}}},v={render:(l,s)=>{var n,i;const t=(i=s==null||(n=s.globals)===null||n===void 0?void 0:n.locale)!==null&&i!==void 0?i:"en";return e.jsxs("div",{className:"flex flex-col gap-3",children:[e.jsxs("div",{className:"flex flex-wrap gap-2",children:[e.jsx(a,{variant:"success",children:r("active","en")}),e.jsx(a,{variant:"success",children:r("active","sq")}),e.jsx(a,{variant:"success",children:r("active","uk")}),e.jsx(a,{variant:"success",children:r("active","it")})]}),e.jsx("p",{className:"text-xs text-muted-foreground",children:"en / sq / uk / it — badge text varies in length"}),e.jsx(a,{variant:"info",children:r("active",t)})]})}};d.parameters={...d.parameters,docs:{...(g=d.parameters)===null||g===void 0?void 0:g.docs,source:{originalSource:`{
  render: (_, context) => {
    const l = context?.globals?.locale as string ?? 'en';
    return <Badge variant="default">{bg('premium', l)}</Badge>;
  }
}`,...(p=d.parameters)===null||p===void 0||(u=p.docs)===null||u===void 0?void 0:u.source}}};o.parameters={...o.parameters,docs:{...(m=o.parameters)===null||m===void 0?void 0:m.docs,source:{originalSource:`{
  render: (_, context) => {
    const l = context?.globals?.locale as string ?? 'en';
    return <div className="flex flex-wrap gap-2">\r
        <Badge variant="default">{bg('new', l)}</Badge>\r
        <Badge variant="secondary">{bg('for_rent', l)}</Badge>\r
        <Badge variant="success">{bg('active', l)}</Badge>\r
        <Badge variant="warning">{bg('pending', l)}</Badge>\r
        <Badge variant="destructive">{bg('archived', l)}</Badge>\r
        <Badge variant="info">{bg('premium', l)}</Badge>\r
        <Badge variant="rented">{bg('rented', l)}</Badge>\r
        <Badge variant="outline">{'Outline'}</Badge>\r
        <Badge variant="neutral">{'Neutral'}</Badge>\r
      </div>;
  }
}`,...(_=o.parameters)===null||_===void 0||(x=_.docs)===null||x===void 0?void 0:x.source}}};c.parameters={...c.parameters,docs:{...(b=c.parameters)===null||b===void 0?void 0:b.docs,source:{originalSource:`{
  render: (_, context) => {
    const l = context?.globals?.locale as string ?? 'en';
    return <div className="flex flex-wrap gap-2">\r
        <Badge variant="success">{bg('active', l)}</Badge>\r
        <Badge variant="warning">{bg('pending', l)}</Badge>\r
        <Badge variant="neutral">{bg('inactive', l)}</Badge>\r
        <Badge variant="destructive">{bg('archived', l)}</Badge>\r
        <Badge variant="rented">{bg('rented', l)}</Badge>\r
      </div>;
  },
  parameters: {
    docs: {
      description: {
        story: 'Canonical listing status badges. Use locale toolbar for sq/en/uk/it.'
      }
    }
  }
}`,...(f=c.parameters)===null||f===void 0||(B=f.docs)===null||B===void 0?void 0:B.source}}};v.parameters={...v.parameters,docs:{...(h=v.parameters)===null||h===void 0?void 0:h.docs,source:{originalSource:`{
  render: (_, context) => {
    const l = context?.globals?.locale as string ?? 'en';
    return <div className="flex flex-col gap-3">\r
        <div className="flex flex-wrap gap-2">\r
          <Badge variant="success">{bg('active', 'en')}</Badge>\r
          <Badge variant="success">{bg('active', 'sq')}</Badge>\r
          <Badge variant="success">{bg('active', 'uk')}</Badge>\r
          <Badge variant="success">{bg('active', 'it')}</Badge>\r
        </div>\r
        <p className="text-xs text-muted-foreground">en / sq / uk / it — badge text varies in length</p>\r
        <Badge variant="info">{bg('active', l)}</Badge>\r
      </div>;
  }
}`,...(w=v.parameters)===null||w===void 0||(j=w.docs)===null||j===void 0?void 0:j.source}}};const O=["Default","AllVariants","ListingStatuses","LocaleVariants"];export{o as AllVariants,d as Default,c as ListingStatuses,v as LocaleVariants,O as __namedExportsOrder,D as default};
