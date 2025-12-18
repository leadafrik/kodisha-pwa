# AGRISOKO LETTERHEAD TEMPLATE

---

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                               │
│  [ LOGO ]        AGRISOKO LTD                                               │
│                  Connecting Farmers to Opportunity                           │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘

_________________________________________________

Date: ________________________


To: ________________________________________________________________

     ________________________________________________________________


Subject: ___________________________________________________________


_________________________________________________

Body Text:

[Your message here]


_________________________________________________


Agrisoko Ltd | Nairobi, Kenya
📞 +254 700 000 000 | 📧 info@agrisoko254ke.com
🌐 www.agrisoko254.com

_________________________________________________

```

---

## OFFICIAL LETTERHEAD (HTML/PRINT VERSION)

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Agrisoko Letterhead</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f5f5f5;
            padding: 20px;
        }
        
        .letterhead-container {
            width: 8.5in;
            height: 11in;
            background-color: white;
            margin: 0 auto;
            padding: 40px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            position: relative;
        }
        
        .header {
            display: flex;
            align-items: center;
            border-bottom: 3px solid #25d366;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        
        .logo {
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #25d366 0%, #128c7e 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 28px;
            margin-right: 20px;
            box-shadow: 0 2px 8px rgba(37, 211, 102, 0.3);
        }
        
        .header-text h1 {
            font-size: 28px;
            color: #1a1a1a;
            margin: 0;
            font-weight: 700;
        }
        
        .header-text p {
            font-size: 14px;
            color: #25d366;
            margin: 3px 0 0 0;
            font-weight: 500;
            letter-spacing: 0.5px;
        }
        
        .content {
            min-height: 400px;
        }
        
        .date-line {
            margin-bottom: 25px;
            color: #333;
        }
        
        .date-line label {
            font-weight: 600;
            color: #666;
            margin-right: 10px;
        }
        
        .date-input {
            border: none;
            border-bottom: 1px solid #333;
            width: 200px;
            padding: 5px 0;
        }
        
        .recipient {
            margin-bottom: 30px;
            color: #333;
        }
        
        .recipient label {
            font-weight: 600;
            color: #666;
            display: block;
            margin-bottom: 5px;
        }
        
        .recipient-input {
            border: none;
            border-bottom: 1px solid #999;
            width: 100%;
            padding: 8px 0;
            line-height: 1.8;
            font-size: 14px;
        }
        
        .subject-line {
            margin: 30px 0;
            color: #333;
        }
        
        .subject-line label {
            font-weight: 600;
            color: #666;
            margin-right: 10px;
        }
        
        .subject-input {
            border: none;
            border-bottom: 1px solid #333;
            width: 100%;
            padding: 5px 0;
            font-style: italic;
        }
        
        .body-text {
            margin: 30px 0;
            line-height: 1.8;
            color: #333;
            font-size: 14px;
        }
        
        .body-input {
            border: none;
            width: 100%;
            min-height: 200px;
            font-family: inherit;
            font-size: 14px;
            resize: vertical;
            padding: 10px 0;
        }
        
        .divider {
            border-top: 2px solid #25d366;
            margin: 40px 0 30px 0;
        }
        
        .footer {
            text-align: center;
            font-size: 12px;
            color: #666;
            line-height: 1.8;
        }
        
        .footer .company-name {
            font-weight: 700;
            color: #1a1a1a;
            margin-bottom: 5px;
        }
        
        .footer .contact-info {
            color: #25d366;
            font-weight: 600;
        }
        
        .footer .website {
            color: #128c7e;
            text-decoration: none;
        }
        
        @media print {
            body {
                background-color: white;
                padding: 0;
            }
            
            .letterhead-container {
                width: 100%;
                height: auto;
                box-shadow: none;
                padding: 0.5in;
            }
        }
    </style>
</head>
<body>
    <div class="letterhead-container">
        <!-- Header -->
        <div class="header">
            <div class="logo">🌾</div>
            <div class="header-text">
                <h1>AGRISOKO LTD</h1>
                <p>Connecting Farmers to Opportunity</p>
            </div>
        </div>
        
        <!-- Content -->
        <div class="content">
            <!-- Date -->
            <div class="date-line">
                <label>Date:</label>
                <input type="text" class="date-input" placeholder="________________________">
            </div>
            
            <!-- Recipient -->
            <div class="recipient">
                <label>To:</label>
                <textarea class="recipient-input" rows="3" placeholder="Recipient Name and Address"></textarea>
            </div>
            
            <!-- Subject -->
            <div class="subject-line">
                <label>Subject:</label>
                <input type="text" class="subject-input" placeholder="_________________________________________________________________">
            </div>
            
            <!-- Body -->
            <div class="body-text">
                <textarea class="body-input" placeholder="Body text..."></textarea>
            </div>
        </div>
        
        <!-- Footer Divider -->
        <div class="divider"></div>
        
        <!-- Footer -->
        <div class="footer">
            <div class="company-name">Agrisoko Ltd | Nairobi, Kenya</div>
            <div class="contact-info">
                📞 +254 700 000 000 | 📧 info@agrisoko254ke.com
            </div>
            <div>
                <a href="https://www.agrisoko254.com" class="website">www.agrisoko254.com</a>
            </div>
        </div>
    </div>
</body>
</html>
```

---

## LETTERHEAD VARIATIONS

### Version 1: Simple Text Format (for printing/PDF)

```
================================================================================
                    [ LOGO ]  AGRISOKO LTD
                    Connecting Farmers to Opportunity
================================================================================

Date: _____________________

To: ____________________________________________________________________

    ____________________________________________________________________


Subject: ________________________________________________________________


================================================================================


Body text here...




================================================================================

Agrisoko Ltd | Nairobi, Kenya
📞 +254 700 000 000 | 📧 info@agrisoko254ke.com
🌐 www.agrisoko254.com

================================================================================
```

---

### Version 2: Professional Microsoft Word Style

```
                           ┌──────────────────┐
                           │   [ LOGO ]       │
                           │  AGRISOKO LTD    │
                           │  Connecting      │
                           │  Farmers to      │
                           │  Opportunity     │
                           └──────────────────┘

═════════════════════════════════════════════════════════════════════════════

Date:        _________________________

To:          _________________________________________________________________

             _________________________________________________________________

Subject:     _________________________________________________________________


═════════════════════════════════════════════════════════════════════════════


                              [Body Text Area]




═════════════════════════════════════════════════════════════════════════════

                    AGRISOKO LTD | Nairobi, Kenya
        📞 +254 700 000 000 | 📧 info@agrisoko254ke.com
              🌐 www.agrisoko254.com

═════════════════════════════════════════════════════════════════════════════
```

---

## LETTERHEAD SPECIFICATIONS

### Brand Colors
- **Primary Green**: #25d366 (WhatsApp-inspired agricultural green)
- **Secondary Teal**: #128c7e (Sustainable agriculture)
- **Text**: #1a1a1a (Dark gray/black for readability)
- **Accent**: #666 (Light gray for secondary text)

### Typography
- **Company Name**: 28pt, Bold, Dark Gray (#1a1a1a)
- **Tagline**: 14pt, Medium, Green (#25d366)
- **Body Text**: 12-14pt, Regular, Dark Gray (#333)
- **Contact Info**: 12pt, Semi-bold, Green (#25d366)

### Layout Dimensions
- **Page Size**: 8.5" × 11" (Standard US Letter)
- **Margins**: 0.5" all around
- **Header Height**: ~1.2"
- **Footer Height**: ~0.8"
- **Content Area**: Remaining space

### Logo Guidelines
- Shape: Circular gradient (WhatsApp style)
- Size: 60px × 60px (on letterhead)
- Colors: Linear gradient from #25d366 to #128c7e
- Icon: 🌾 (crop/farming emoji) or custom icon

### Contact Information
- **Company**: Agrisoko Ltd
- **Location**: Nairobi, Kenya
- **Phone**: +254 700 000 000 (update with actual number)
- **Email**: info@agrisoko254ke.com
- **Website**: www.agrisoko254.com

---

## USAGE GUIDELINES

### When to Use This Letterhead
- Official business correspondence
- Partnership and vendor communications
- Customer invoices and quotes
- Legal and compliance documents
- Investor correspondence
- Media and PR communications

### How to Customize
1. **Logo**: Replace [ LOGO ] with actual Agrisoko logo
2. **Phone Number**: Update +254 700 000 000 with actual contact number
3. **Recipient**: Fill in actual recipient details
4. **Date**: Add current date
5. **Subject**: Add letter subject
6. **Body**: Add your message
7. **Signature**: Add authorized signatory name and title

### Print Settings
- **Paper**: White, 20lb bond (or higher quality)
- **Color**: Full color (CMYK for printing)
- **Margins**: 0.5" on all sides
- **Font Rendering**: Enable embedded fonts
- **Quality**: 300 DPI for professional printing

---

## DIGITAL VERSION INSTRUCTIONS

### For Email Use
1. Save as PDF with embedded fonts
2. Use professional email signature
3. Include QR code linking to www.agrisoko254.com (optional)
4. Ensure mobile-friendly formatting

### For Web/Cloud Use
- Use the HTML version provided above
- Host on company website for easy sharing
- Ensure responsive design for all devices
- Include digital signature capability

---

**Document Created**: December 17, 2025  
**Version**: 1.0  
**Status**: Ready for Use
