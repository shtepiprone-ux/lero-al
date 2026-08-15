import{j as e}from"./iframe-BWqC60Cj.js";import{B as m}from"./button-DqckHWPj.js";import{S as h,a as T,b as p,c as v,d as u,e as L}from"./sheet-D01mHhYp.js";import{s as F}from"./_storyI18n-DUPbxmag.js";import{F as H}from"./funnel-BcadKEg1.js";import{M as z}from"./menu-B8kgrjx_.js";import"./preload-helper-Dp1pzeXC.js";import"./index-D4MQtXW4.js";import"./utils-D5ceN5oG.js";import"./useButton-62N7Qls-.js";import"./useIsoLayoutEffect-BlzvCgLy.js";import"./useRenderElement-DCWLj8DQ.js";import"./index-PXfbuUw3.js";import"./x-oNeZx8ai.js";import"./createLucideIcon-DZTr3VOw.js";import"./DialogTrigger-B5XcOvoT.js";import"./useInteractions-CUNok2Pe.js";import"./useTransitionStatus-C523vQjG.js";import"./createBaseUIEventDetails-urpO65QN.js";import"./inertValue-DeE1CYDS.js";import"./visuallyHidden-COI6QeQH.js";import"./shadowDom-KUr5fxLu.js";import"./index-DTzEXCUc.js";import"./useOpenInteractionType-D7GLRI-3.js";import"./useValueChanged-DYbhOE3F.js";import"./useRole-BHvzd0LU.js";import"./getEmptyRootContext-CBnq-fR5.js";var _,S,g,x,f,b,j,w,y,N,B,C;const ie={title:"Primitives/Sheet",tags:["autodocs"],parameters:{docs:{description:{component:"Canonical drawer/panel. ALWAYS use Sheet instead of custom div.fixed.inset-0 mobile drawers. See docs/ui-rules.md §12."}}}},o=(a,r="en")=>F(r,`storybook.sheet.${a}`),l={render:(a,r)=>{var n,s;const t=(s=r==null||(n=r.globals)===null||n===void 0?void 0:n.locale)!==null&&s!==void 0?s:"en";return e.jsxs(h,{children:[e.jsx(T,{render:e.jsx(m,{size:"icon-xl",variant:"outline","aria-label":o("open_filters",t),children:e.jsx(H,{})})}),e.jsxs(p,{side:"right",className:"w-72",children:[e.jsxs(v,{children:[e.jsx(u,{children:o("filters",t)}),e.jsx(L,{children:o("narrow_q",t)})]}),e.jsx("div",{className:"py-4 space-y-4",children:e.jsx("p",{className:"text-sm text-muted-foreground",children:o("filter_here",t)})})]})]})},parameters:{docs:{description:{story:"Filter panel sheet — canonical pattern for mobile filter overlay."}}},globals:{viewport:{value:"mobile375",isRotated:!1}}},i={render:(a,r)=>{var n,s;const t=(s=r==null||(n=r.globals)===null||n===void 0?void 0:n.locale)!==null&&s!==void 0?s:"en";return e.jsx(h,{defaultOpen:!0,children:e.jsxs(p,{side:"bottom",children:[e.jsxs(v,{children:[e.jsx(u,{children:o("filters",t)}),e.jsx(L,{children:o("narrow_q",t)})]}),e.jsx("div",{className:"py-4 space-y-4",children:e.jsx("p",{className:"text-sm text-muted-foreground",children:o("filter_here",t)})})]})})},parameters:{docs:{description:{story:'@320: sheet pre-opened with side="bottom" — full-width bottom sheet, drag handle, edge-to-edge. Use locale toolbar.'}}},globals:{viewport:{value:"mobile320",isRotated:!1}}},c={render:(a,r)=>{var n,s;const t=(s=r==null||(n=r.globals)===null||n===void 0?void 0:n.locale)!==null&&s!==void 0?s:"en",R=[o("home",t),o("listings",t),o("favorites",t),o("about",t)];return e.jsxs(h,{children:[e.jsx(T,{render:e.jsx(m,{size:"icon-xl",variant:"ghost","aria-label":o("open_nav",t),children:e.jsx(z,{})})}),e.jsxs(p,{side:"left",className:"w-64",children:[e.jsx(v,{children:e.jsx(u,{children:o("menu",t)})}),e.jsx("nav",{className:"py-4 space-y-1",children:R.map(D=>e.jsx(m,{variant:"ghost",size:"default",className:"w-full justify-start text-sm",children:D},D))})]})]})},parameters:{docs:{description:{story:"Navigation drawer — canonical left-side panel for mobile navigation."}}},globals:{viewport:{value:"mobile375",isRotated:!1}}},d={render:(a,r)=>{var n,s;const t=(s=r==null||(n=r.globals)===null||n===void 0?void 0:n.locale)!==null&&s!==void 0?s:"en";return e.jsxs(h,{children:[e.jsx(T,{render:e.jsx(m,{size:"xl",children:o("open_sheet",t)})}),e.jsxs(p,{side:"right",className:"w-72",children:[e.jsxs(v,{children:[e.jsx(u,{children:o("search_filters",t)}),e.jsx(L,{children:o("refine",t)})]}),e.jsx("div",{className:"py-4 text-sm text-muted-foreground",children:o("params_here",t)})]})]})},parameters:{docs:{description:{story:"Locale variant — Sheet header with longer title/description. Use locale toolbar to switch sq/en/uk/it."}}}};l.parameters={...l.parameters,docs:{...(_=l.parameters)===null||_===void 0?void 0:_.docs,source:{originalSource:`{
  render: (_, context) => {
    const locale = context?.globals?.locale as string ?? "en";
    return <Sheet>\r
        <SheetTrigger render={<Button size="icon-xl" variant="outline" aria-label={s("open_filters", locale)}><Filter /></Button>} />\r
        <SheetContent side="right" className="w-72">\r
          <SheetHeader>\r
            <SheetTitle>{s("filters", locale)}</SheetTitle>\r
            <SheetDescription>{s("narrow_q", locale)}</SheetDescription>\r
          </SheetHeader>\r
          <div className="py-4 space-y-4">\r
            <p className="text-sm text-muted-foreground">{s("filter_here", locale)}</p>\r
          </div>\r
        </SheetContent>\r
      </Sheet>;
  },
  parameters: {
    docs: {
      description: {
        story: "Filter panel sheet — canonical pattern for mobile filter overlay."
      }
    }
  },
  globals: {
    viewport: {
      value: "mobile375",
      isRotated: false
    }
  }
}`,...(g=l.parameters)===null||g===void 0||(S=g.docs)===null||S===void 0?void 0:S.source}}};i.parameters={...i.parameters,docs:{...(x=i.parameters)===null||x===void 0?void 0:x.docs,source:{originalSource:`{
  render: (_, context) => {
    const locale = context?.globals?.locale as string ?? "en";
    return <Sheet defaultOpen>\r
        <SheetContent side="bottom">\r
          <SheetHeader>\r
            <SheetTitle>{s("filters", locale)}</SheetTitle>\r
            <SheetDescription>{s("narrow_q", locale)}</SheetDescription>\r
          </SheetHeader>\r
          <div className="py-4 space-y-4">\r
            <p className="text-sm text-muted-foreground">{s("filter_here", locale)}</p>\r
          </div>\r
        </SheetContent>\r
      </Sheet>;
  },
  parameters: {
    docs: {
      description: {
        story: "@320: sheet pre-opened with side=\\"bottom\\" — full-width bottom sheet, drag handle, edge-to-edge. Use locale toolbar."
      }
    }
  },
  globals: {
    viewport: {
      value: "mobile320",
      isRotated: false
    }
  }
}`,...(b=i.parameters)===null||b===void 0||(f=b.docs)===null||f===void 0?void 0:f.source}}};c.parameters={...c.parameters,docs:{...(j=c.parameters)===null||j===void 0?void 0:j.docs,source:{originalSource:`{
  render: (_, context) => {
    const locale = context?.globals?.locale as string ?? "en";
    const navItems = [s("home", locale), s("listings", locale), s("favorites", locale), s("about", locale)];
    return <Sheet>\r
        <SheetTrigger render={<Button size="icon-xl" variant="ghost" aria-label={s("open_nav", locale)}><Menu /></Button>} />\r
        <SheetContent side="left" className="w-64">\r
          <SheetHeader>\r
            <SheetTitle>{s("menu", locale)}</SheetTitle>\r
          </SheetHeader>\r
          <nav className="py-4 space-y-1">\r
            {navItems.map(item => <Button key={item} variant="ghost" size="default" className="w-full justify-start text-sm">{item}</Button>)}\r
          </nav>\r
        </SheetContent>\r
      </Sheet>;
  },
  parameters: {
    docs: {
      description: {
        story: "Navigation drawer — canonical left-side panel for mobile navigation."
      }
    }
  },
  globals: {
    viewport: {
      value: "mobile375",
      isRotated: false
    }
  }
}`,...(y=c.parameters)===null||y===void 0||(w=y.docs)===null||w===void 0?void 0:w.source}}};d.parameters={...d.parameters,docs:{...(N=d.parameters)===null||N===void 0?void 0:N.docs,source:{originalSource:`{
  render: (_, context) => {
    const locale = context?.globals?.locale as string ?? "en";
    return <Sheet>\r
        <SheetTrigger render={<Button size="xl">{s("open_sheet", locale)}</Button>} />\r
        <SheetContent side="right" className="w-72">\r
          <SheetHeader>\r
            <SheetTitle>{s("search_filters", locale)}</SheetTitle>\r
            <SheetDescription>{s("refine", locale)}</SheetDescription>\r
          </SheetHeader>\r
          <div className="py-4 text-sm text-muted-foreground">\r
            {s("params_here", locale)}\r
          </div>\r
        </SheetContent>\r
      </Sheet>;
  },
  parameters: {
    docs: {
      description: {
        story: "Locale variant — Sheet header with longer title/description. Use locale toolbar to switch sq/en/uk/it."
      }
    }
  }
}`,...(C=d.parameters)===null||C===void 0||(B=C.docs)===null||B===void 0?void 0:B.source}}};const ce=["FilterSheetRight","MobileBottomSheet","NavDrawerLeft","LocaleSheetContent"];export{l as FilterSheetRight,d as LocaleSheetContent,i as MobileBottomSheet,c as NavDrawerLeft,ce as __namedExportsOrder,ie as default};
