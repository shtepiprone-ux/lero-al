import{j as e}from"./iframe-BWqC60Cj.js";import{B as i}from"./button-DqckHWPj.js";import{D as s,a as b,b as d,c,d as u,e as g,f as p}from"./dialog-Bpi0EtBt.js";import{s as W}from"./_storyI18n-DUPbxmag.js";import"./preload-helper-Dp1pzeXC.js";import"./index-D4MQtXW4.js";import"./utils-D5ceN5oG.js";import"./useButton-62N7Qls-.js";import"./useIsoLayoutEffect-BlzvCgLy.js";import"./useRenderElement-DCWLj8DQ.js";import"./index-PXfbuUw3.js";import"./x-oNeZx8ai.js";import"./createLucideIcon-DZTr3VOw.js";import"./DialogTrigger-B5XcOvoT.js";import"./useInteractions-CUNok2Pe.js";import"./useTransitionStatus-C523vQjG.js";import"./createBaseUIEventDetails-urpO65QN.js";import"./inertValue-DeE1CYDS.js";import"./visuallyHidden-COI6QeQH.js";import"./shadowDom-KUr5fxLu.js";import"./index-DTzEXCUc.js";import"./useOpenInteractionType-D7GLRI-3.js";import"./useValueChanged-DYbhOE3F.js";import"./useRole-BHvzd0LU.js";import"./getEmptyRootContext-CBnq-fR5.js";var h,j,f,B,y,C,L,T,F,z,M,q,H,w,S;const ce={title:"Primitives/Dialog",tags:["autodocs"],parameters:{docs:{description:{component:"Canonical modal. ALWAYS use Dialog instead of custom div.fixed.inset-0 overlays. See docs/ui-rules.md §12."}}}},l=(n,r="en")=>W(r,`storybook.dialog.${n}`),A=Array.from({length:8}),m={render:(n,r)=>{var t,a;const o=(a=r==null||(t=r.globals)===null||t===void 0?void 0:t.locale)!==null&&a!==void 0?a:"en";return e.jsxs(s,{children:[e.jsx(b,{render:e.jsx(i,{children:l("open",o)})}),e.jsxs(d,{children:[e.jsxs(c,{children:[e.jsx(u,{children:l("confirm",o)}),e.jsx(g,{children:l("archive_q",o)})]}),e.jsxs(p,{children:[e.jsx(i,{variant:"outline",children:l("cancel",o)}),e.jsx(i,{variant:"destructive",children:l("archive",o)})]})]})]})}},v={render:(n,r)=>{var t,a;const o=(a=r==null||(t=r.globals)===null||t===void 0?void 0:t.locale)!==null&&a!==void 0?a:"en";return e.jsxs(s,{children:[e.jsx(b,{render:e.jsx(i,{children:l("terms_btn",o)})}),e.jsxs(d,{children:[e.jsxs(c,{children:[e.jsx(u,{children:l("terms_title",o)}),e.jsx(g,{children:l("terms_sub",o)})]}),e.jsx("div",{className:"space-y-3 text-sm",children:A.map((O,R)=>e.jsx("p",{className:"text-muted-foreground",children:"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."},R))}),e.jsx(p,{children:e.jsx(i,{size:"xl",children:l("accept",o)})})]})]})},parameters:{docs:{description:{story:"Long content: only body region scrolls. Close X fixed above scroll."}}}},_={render:(n,r)=>{var t,a;const o=(a=r==null||(t=r.globals)===null||t===void 0?void 0:t.locale)!==null&&a!==void 0?a:"en";return e.jsxs(s,{children:[e.jsx(b,{render:e.jsx(i,{size:"xl",children:l("delete_btn",o)})}),e.jsxs(d,{children:[e.jsxs(c,{children:[e.jsx(u,{children:l("delete_btn",o)}),e.jsx(g,{children:l("delete_q",o)})]}),e.jsxs(p,{children:[e.jsx(i,{size:"xl",variant:"outline",children:l("cancel",o)}),e.jsx(i,{size:"xl",variant:"destructive",children:l("delete",o)})]})]})]})},parameters:{docs:{description:{story:"Mobile 375px: trigger full-width, dialog is a full-width bottom sheet. Use locale toolbar."}}},globals:{viewport:{value:"mobile375",isRotated:!1}}},D={render:(n,r)=>{var t,a;const o=(a=r==null||(t=r.globals)===null||t===void 0?void 0:t.locale)!==null&&a!==void 0?a:"en";return e.jsx(s,{defaultOpen:!0,children:e.jsxs(d,{children:[e.jsxs(c,{children:[e.jsx(u,{children:l("confirm_act",o)}),e.jsx(g,{children:l("irrev_q",o)})]}),e.jsxs(p,{children:[e.jsx(i,{size:"xl",variant:"outline",children:l("cancel",o)}),e.jsx(i,{size:"xl",variant:"destructive",children:l("delete",o)})]})]})})},parameters:{docs:{description:{story:"@320: dialog pre-opened — full-width bottom sheet. Use locale toolbar."}}},globals:{viewport:{value:"mobile320",isRotated:!1}}},x={render:(n,r)=>{var t,a;const o=(a=r==null||(t=r.globals)===null||t===void 0?void 0:t.locale)!==null&&a!==void 0?a:"en";return e.jsxs(s,{children:[e.jsx(b,{render:e.jsx(i,{size:"xl",children:l("open",o)})}),e.jsxs(d,{children:[e.jsxs(c,{children:[e.jsx(u,{children:l("confirm_act",o)}),e.jsx(g,{children:l("irrev_q",o)})]}),e.jsxs(p,{children:[e.jsx(i,{variant:"outline",children:l("cancel",o)}),e.jsx(i,{variant:"destructive",children:l("delete",o)})]})]})]})},parameters:{docs:{description:{story:"Locale variant — use locale toolbar for sq/en/uk/it. All labels update live."}}}};m.parameters={...m.parameters,docs:{...(h=m.parameters)===null||h===void 0?void 0:h.docs,source:{originalSource:`{
  render: (_, context) => {
    const locale = context?.globals?.locale as string ?? "en";
    return <Dialog>\r
        <DialogTrigger render={<Button>{d("open", locale)}</Button>} />\r
        <DialogContent>\r
          <DialogHeader>\r
            <DialogTitle>{d("confirm", locale)}</DialogTitle>\r
            <DialogDescription>{d("archive_q", locale)}</DialogDescription>\r
          </DialogHeader>\r
          <DialogFooter>\r
            <Button variant="outline">{d("cancel", locale)}</Button>\r
            <Button variant="destructive">{d("archive", locale)}</Button>\r
          </DialogFooter>\r
        </DialogContent>\r
      </Dialog>;
  }
}`,...(f=m.parameters)===null||f===void 0||(j=f.docs)===null||j===void 0?void 0:j.source}}};v.parameters={...v.parameters,docs:{...(B=v.parameters)===null||B===void 0?void 0:B.docs,source:{originalSource:`{
  render: (_, context) => {
    const locale = context?.globals?.locale as string ?? "en";
    return <Dialog>\r
        <DialogTrigger render={<Button>{d("terms_btn", locale)}</Button>} />\r
        <DialogContent>\r
          <DialogHeader>\r
            <DialogTitle>{d("terms_title", locale)}</DialogTitle>\r
            <DialogDescription>{d("terms_sub", locale)}</DialogDescription>\r
          </DialogHeader>\r
          <div className="space-y-3 text-sm">\r
            {LOREM.map((_, i) => <p key={i} className="text-muted-foreground">{'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'}</p>)}\r
          </div>\r
          <DialogFooter>\r
            <Button size="xl">{d("accept", locale)}</Button>\r
          </DialogFooter>\r
        </DialogContent>\r
      </Dialog>;
  },
  parameters: {
    docs: {
      description: {
        story: "Long content: only body region scrolls. Close X fixed above scroll."
      }
    }
  }
}`,...(C=v.parameters)===null||C===void 0||(y=C.docs)===null||y===void 0?void 0:y.source}}};_.parameters={..._.parameters,docs:{...(L=_.parameters)===null||L===void 0?void 0:L.docs,source:{originalSource:`{
  render: (_, context) => {
    const locale = context?.globals?.locale as string ?? "en";
    return <Dialog>\r
        <DialogTrigger render={<Button size="xl">{d("delete_btn", locale)}</Button>} />\r
        <DialogContent>\r
          <DialogHeader>\r
            <DialogTitle>{d("delete_btn", locale)}</DialogTitle>\r
            <DialogDescription>{d("delete_q", locale)}</DialogDescription>\r
          </DialogHeader>\r
          <DialogFooter>\r
            <Button size="xl" variant="outline">{d("cancel", locale)}</Button>\r
            <Button size="xl" variant="destructive">{d("delete", locale)}</Button>\r
          </DialogFooter>\r
        </DialogContent>\r
      </Dialog>;
  },
  parameters: {
    docs: {
      description: {
        story: "Mobile 375px: trigger full-width, dialog is a full-width bottom sheet. Use locale toolbar."
      }
    }
  },
  globals: {
    viewport: {
      value: "mobile375",
      isRotated: false
    }
  }
}`,...(F=_.parameters)===null||F===void 0||(T=F.docs)===null||T===void 0?void 0:T.source}}};D.parameters={...D.parameters,docs:{...(z=D.parameters)===null||z===void 0?void 0:z.docs,source:{originalSource:`{
  render: (_, context) => {
    const locale = context?.globals?.locale as string ?? "en";
    return <Dialog defaultOpen>\r
        <DialogContent>\r
          <DialogHeader>\r
            <DialogTitle>{d("confirm_act", locale)}</DialogTitle>\r
            <DialogDescription>{d("irrev_q", locale)}</DialogDescription>\r
          </DialogHeader>\r
          <DialogFooter>\r
            <Button size="xl" variant="outline">{d("cancel", locale)}</Button>\r
            <Button size="xl" variant="destructive">{d("delete", locale)}</Button>\r
          </DialogFooter>\r
        </DialogContent>\r
      </Dialog>;
  },
  parameters: {
    docs: {
      description: {
        story: "@320: dialog pre-opened — full-width bottom sheet. Use locale toolbar."
      }
    }
  },
  globals: {
    viewport: {
      value: "mobile320",
      isRotated: false
    }
  }
}`,...(q=D.parameters)===null||q===void 0||(M=q.docs)===null||M===void 0?void 0:M.source}}};x.parameters={...x.parameters,docs:{...(H=x.parameters)===null||H===void 0?void 0:H.docs,source:{originalSource:`{
  render: (_, context) => {
    const locale = context?.globals?.locale as string ?? "en";
    return <Dialog>\r
        <DialogTrigger render={<Button size="xl">{d("open", locale)}</Button>} />\r
        <DialogContent>\r
          <DialogHeader>\r
            <DialogTitle>{d("confirm_act", locale)}</DialogTitle>\r
            <DialogDescription>{d("irrev_q", locale)}</DialogDescription>\r
          </DialogHeader>\r
          <DialogFooter>\r
            <Button variant="outline">{d("cancel", locale)}</Button>\r
            <Button variant="destructive">{d("delete", locale)}</Button>\r
          </DialogFooter>\r
        </DialogContent>\r
      </Dialog>;
  },
  parameters: {
    docs: {
      description: {
        story: "Locale variant — use locale toolbar for sq/en/uk/it. All labels update live."
      }
    }
  }
}`,...(S=x.parameters)===null||S===void 0||(w=S.docs)===null||w===void 0?void 0:w.source}}};const ue=["Default","LongContent","MobileDialog","MobileFullWidth","LocaleVariant"];export{m as Default,x as LocaleVariant,v as LongContent,_ as MobileDialog,D as MobileFullWidth,ue as __namedExportsOrder,ce as default};
