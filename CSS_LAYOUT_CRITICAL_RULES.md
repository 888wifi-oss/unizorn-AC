# ⚠️ CSS Layout Critical Rules - ห้ามแก้ไขโดยเด็ดขาด

## 📋 บทบัญญัติสำคัญ

### ❌ ห้ามทำสิ่งต่อไปนี้:

#### 1. **ห้ามใส่ letter-spacing ใน div**
```css
/* ❌ ผิด - ห้ามทำแบบนี้! */
div {
  letter-spacing: 0.01em;
}

/* ✅ ถูก - ใช้แบบนี้เท่านั้น */
p, span {
  letter-spacing: 0.01em;
}
```

**เหตุผล:** การใส่ `letter-spacing` ใน `div` จะทำให้ Mobile Layout หาย และ UI เพี้ยน

#### 2. **ห้ามใช้ CSS ที่ส่งผลต่อ layout container**
```css
/* ❌ ผิด - ห้าม apply กับ container */
.container, .layout, .wrapper {
  letter-spacing: ...;
  word-spacing: ...;
}

/* ✅ ถูก - ใช้กับ text elements เท่านั้น */
p, span, h1, h2, h3, h4, h5, h6 {
  letter-spacing: 0.01em;
}
```

#### 3. **ห้ามเพิ่ม CSS properties ที่รบกวน flexbox/grid**
```css
/* ❌ ผิด - ห้ามทำ */
.flex-container {
  letter-spacing: 0.01em;
}

/* ✅ ถูก - ใช้กับ text เท่านั้น */
.text-content {
  letter-spacing: 0.01em;
}
```

---

## ✅ สิ่งที่ปลอดภัยสำหรับ Mobile Layout

### 1. **ใช้กับ Text Elements เท่านั้น**
```css
/* ✅ ปลอดภัย */
p, span {
  letter-spacing: 0.01em;
}

h1, h2, h3, h4, h5, h6 {
  letter-spacing: 0.01em;
}
```

### 2. **Typography specific styles**
```css
/* ✅ ปลอดภัย - ใช้กับ typography */
.title {
  letter-spacing: 0.01em;
}

.description {
  letter-spacing: 0.01em;
}
```

### 3. **Global Styles ที่ปลอดภัย**
```css
/* ✅ ปลอดภัย */
body {
  font-family: var(--font-sans);
  font-size: 16px;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}
```

---

## 🎯 กฎเหล็ก (Golden Rules)

### Rule #1: อย่าส่งผลต่อ Container
```css
/* ห้ามแก้ไข properties นี้กับ div, flex, grid */
- letter-spacing
- word-spacing
- text-indent (ถ้าไม่จำเป็น)
```

### Rule #2: ใช้กับ Text Elements เท่านั้น
```css
/* ✅ ปลอดภัย */
p, span, h1, h2, h3, h4, h5, h6, label {
  /* text styling OK */
}
```

### Rule #3: ตรวจสอบ Responsive เสมอ
```css
/* เมื่อแก้ไข CSS ตรวจสอบ: */
/* - Mobile (< 768px) */
/* - Tablet (768px - 1024px) */
/* - Desktop (> 1024px) */
```

---

## 📝 Checklist ก่อนแก้ไข CSS

### ก่อนแก้ไข `app/globals.css`:

- [ ] ตรวจสอบว่า CSS นี้ไม่กระทบ container elements
- [ ] ทดสอบ Mobile view (responsive)
- [ ] ทดสอบ Desktop view
- [ ] ตรวจสอบ Console logs (ไม่มี error)
- [ ] ตรวจสอบ Layout (ไม่เพี้ยน)

### ก่อนแก้ไข Layout files:

- [ ] ตรวจสอบ Responsive breakpoints
- [ ] ทดสอบ Mobile navigation
- [ ] ตรวจสอบ Bottom navigation (mobile)
- [ ] ตรวจสอบ Header (mobile/desktop)

---

## 🚨 สัญญาณอันตราย

### ถ้าเห็นดังต่อไปนี้ ต้องรีบแก้ไขทันที:

1. **Mobile Layout หายไป**
   - ปัญหา: `letter-spacing` หรือ CSS อื่นๆ ใน `div`

2. **UI เพี้ยนบน Mobile**
   - ปัญหา: CSS ที่ส่งผลต่อ flexbox/grid

3. **Navigation ไม่แสดง**
   - ปัญหา: z-index หรือ display properties

4. **Button/Icon หาย**
   - ปัญหา: color หรือ visibility properties

---

## 📦 ไฟล์ที่ห้ามแก้ไขโดยไม่ประมาท

### ⚠️ Critical Files:
- `app/globals.css` - CSS หลักของระบบ
- `app/portal/layout.tsx` - Portal Layout
- `components/bottom-navigation.tsx` - Mobile Navigation
- `components/ui/*` - UI Components

### ⚠️ ก่อนแก้ไขต้อง:
1. Backup code ปัจจุบัน
2. ทดสอบ Mobile view
3. ทดสอบ Desktop view
4. ตรวจสอบ Responsive breakpoints

---

## 💡 Best Practices

### 1. ใช้ Tailwind Classes แทน CSS เมื่อเป็นไปได้
```tsx
// ✅ ดี - ใช้ Tailwind
<div className="flex items-center gap-2">

// ❌ ไม่ดี - ใช้ CSS inline
<div style={{ letterSpacing: '0.01em' }}>
```

### 2. จำกัด Scoping ของ CSS
```css
/* ✅ ดี - จำกัด scope */
.text-content p {
  letter-spacing: 0.01em;
}

/* ❌ ไม่ดี - global scope */
div {
  letter-spacing: 0.01em;
}
```

### 3. ใช้ CSS Modules หรือ Scoped Styles
```css
/* ✅ ดี - scoped */
.my-component {
  /* styles here are scoped */
}
```

---

## 📚 เอกสารอ้างอิง

- [Tailwind CSS - Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [CSS Flexbox Guide](https://css-tricks.com/snippets/css/a-guide-to-flexbox/)
- [Mobile-First Design](https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Responsive_Design)

---

**🎯 ข้อสรุป: อย่าแก้ไข CSS ที่ส่งผลต่อ container elements โดยเด็ดขาด!**



















