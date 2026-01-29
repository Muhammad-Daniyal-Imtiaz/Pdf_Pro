import React from 'react'
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer'
import { CVTemplate, CVSection } from '../lib/cv-templates'

// Register fonts - We'll use standard fonts for now to ensure compatibility
// In a real production app with assets, we would register custom fonts here.

interface CVPdfDocumentProps {
    template: CVTemplate
}

// Helper to strip HTML and handle simple breaks
const processContent = (html: string) => {
    if (!html) return ''
    // Replace <br>, <p>, </div> with newlines
    let text = html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<\/div>/gi, '\n')
    // Strip remaining tags
    text = text.replace(/<[^>]+>/g, '')
    // Decode entities (basic)
    text = text
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')

    return text.trim()
}

export const CVPdfDocument = ({ template }: CVPdfDocumentProps) => {
    const { styles, structure } = template

    // Dynamic Styles
    const pdfStyles = StyleSheet.create({
        page: {
            flexDirection: 'column',
            backgroundColor: styles.backgroundColor || '#ffffff',
            fontFamily: 'Helvetica', // Fallback
            padding: 0, // We control padding in containers
        },
        container: {
            padding: 30,
            flex: 1,
        },
        // Typography
        name: {
            fontSize: 24,
            fontWeight: 'bold',
            color: styles.primaryColor,
            marginBottom: 4,
        },
        title: {
            fontSize: 14,
            color: styles.secondaryColor,
            marginBottom: 10,
        },
        sectionTitle: {
            fontSize: 12,
            fontWeight: 'bold',
            color: styles.accentColor,
            textTransform: 'uppercase',
            borderBottomWidth: 1,
            borderBottomColor: styles.accentColor,
            marginBottom: 6,
            marginTop: 10,
            paddingBottom: 2,
        },
        content: {
            fontSize: 10,
            lineHeight: styles.spacing || 1.4,
            color: '#333333',
            marginBottom: 4,
        },
        contactRow: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 10,
            marginBottom: 15,
            fontSize: 9,
            color: '#555555',
        },
        contactItem: {
            marginRight: 10,
        },
        // Layout specifics
        twoColContainer: {
            flexDirection: 'row',
            height: '100%',
        },
        sidebar: {
            width: styles.sidebarWidth || '30%',
            backgroundColor: styles.layout === 'sidebar' ? (styles.secondaryColor + '10') : 'transparent', // Light tint if sidebar layout
            padding: 20,
            borderRightWidth: 1,
            borderRightColor: '#eeeeee',
        },
        main: {
            flex: 1,
            padding: 20,
        },
        threeColContainer: {
            flexDirection: 'row',
            height: '100%',
        },
        colLeft: {
            width: '25%',
            padding: 10,
        },
        colCenter: {
            width: '50%',
            padding: 20,
            borderLeftWidth: 1,
            borderRightWidth: 1,
            borderColor: '#eeeeee',
        },
        colRight: {
            width: '25%',
            padding: 10,
        },
    })

    // Data helpers
    const personalSection = structure.find(s => s.type === 'personal')
    const getField = (id: string) => personalSection?.fields?.find(f => f.id === id)?.value || ''
    const name = getField('name')
    const jobTitle = getField('title')

    const contactFields = personalSection?.fields?.filter(f => !['name', 'title'].includes(f.id) && f.value) || []

    // Renderers
    const RenderSection = ({ section }: { section: CVSection }) => (
        <View key={section.id} wrap={false}>
            <Text style={pdfStyles.sectionTitle}>{section.title}</Text>
            <Text style={pdfStyles.content}>{processContent(section.content)}</Text>
        </View>
    )

    const RenderHeader = () => (
        <View style={{ marginBottom: 20 }}>
            {name && <Text style={pdfStyles.name}>{name}</Text>}
            {jobTitle && <Text style={pdfStyles.title}>{jobTitle}</Text>}
            <View style={pdfStyles.contactRow}>
                {contactFields.map((f) => (
                    <Text key={f.id} style={pdfStyles.contactItem}>{f.value}</Text>
                ))}
            </View>
        </View>
    )

    // Layout Logic
    const sections = structure.filter(s => s.type !== 'personal')

    const renderContent = () => {
        if (styles.layout === 'twocolumn' || styles.layout === 'sidebar') {
            const sidebarSecs = sections.filter(s => ['skills', 'education', 'languages', 'certifications', 'contact'].includes(s.type))
            const mainSecs = sections.filter(s => !['skills', 'education', 'languages', 'certifications', 'contact'].includes(s.type))

            return (
                <View style={pdfStyles.twoColContainer}>
                    <View style={pdfStyles.sidebar}>
                        {/* If sidebar layout, maybe header is in sidebar? For now, stick to simplified logic */}
                        {styles.layout === 'sidebar' && <RenderHeader />}
                        {sidebarSecs.map(s => <RenderSection key={s.id} section={s} />)}
                    </View>
                    <View style={pdfStyles.main}>
                        {styles.layout !== 'sidebar' && <RenderHeader />}
                        {mainSecs.map(s => <RenderSection key={s.id} section={s} />)}
                    </View>
                </View>
            )
        }

        if (styles.layout === 'threecolumn') {
            const leftSecs = sections.filter(s => ['skills', 'languages'].includes(s.type))
            const rightSecs = sections.filter(s => ['education', 'certifications'].includes(s.type))
            const centerSecs = sections.filter(s => !['skills', 'languages', 'education', 'certifications'].includes(s.type))

            return (
                <View style={{ flex: 1 }}>
                    <View style={{ padding: 20, textAlign: 'center', backgroundColor: '#f9f9f9', marginBottom: 10 }}>
                        {name && <Text style={[pdfStyles.name, { alignSelf: 'center' }]}>{name}</Text>}
                        {jobTitle && <Text style={[pdfStyles.title, { alignSelf: 'center' }]}>{jobTitle}</Text>}
                        <View style={[pdfStyles.contactRow, { justifyContent: 'center' }]}>
                            {contactFields.map((f) => (
                                <Text key={f.id} style={pdfStyles.contactItem}>{f.value}</Text>
                            ))}
                        </View>
                    </View>
                    <View style={pdfStyles.threeColContainer}>
                        <View style={pdfStyles.colLeft}>
                            {leftSecs.map(s => <RenderSection key={s.id} section={s} />)}
                        </View>
                        <View style={pdfStyles.colCenter}>
                            {centerSecs.map(s => <RenderSection key={s.id} section={s} />)}
                        </View>
                        <View style={pdfStyles.colRight}>
                            {rightSecs.map(s => <RenderSection key={s.id} section={s} />)}
                        </View>
                    </View>
                </View>
            )
        }

        // Default Classic
        return (
            <View style={pdfStyles.container}>
                <RenderHeader />
                {sections.map(s => <RenderSection key={s.id} section={s} />)}
            </View>
        )
    }

    return (
        <Document>
            <Page size="A4" style={pdfStyles.page}>
                {renderContent()}
            </Page>
        </Document>
    )
}
