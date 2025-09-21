import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create default email templates
  const templates = [
    {
      name: 'Professional Standard',
      subject: 'Application for {{jobTitle}} Position',
      body: `Dear Hiring Manager,

I hope this email finds you well. I am writing to express my strong interest in the {{jobTitle}} position at {{company}}.

With my background as a {{role}}, I am excited about the opportunity to contribute to your team. I have attached my resume for your review and would welcome the chance to discuss how my skills and experience align with your needs.

{{notes}}

Thank you for considering my application. I look forward to hearing from you soon.

Best regards,
[Your Name]`
    },
    {
      name: 'Casual & Friendly',
      subject: 'Excited about the {{jobTitle}} role!',
      body: `Hi there!

I came across the {{jobTitle}} position at {{company}} and I'm really excited about the opportunity to join your team as a {{role}}.

I've attached my resume and would love to chat more about how I can contribute to your projects. 

{{notes}}

Looking forward to connecting!

Best,
[Your Name]`
    },
    {
      name: 'Technical Focus',
      subject: 'Technical {{role}} - {{jobTitle}} Application',
      body: `Dear Technical Hiring Team,

I am submitting my application for the {{jobTitle}} position at {{company}}. As an experienced {{role}}, I am particularly drawn to this opportunity because of the technical challenges and growth potential it offers.

My technical expertise includes:
- [List key technologies/skills relevant to the role]
- [Mention specific projects or achievements]
- [Highlight relevant experience]

{{notes}}

I have attached my resume and would appreciate the opportunity to discuss my qualifications in detail.

Thank you for your time and consideration.

Sincerely,
[Your Name]`
    },
    {
      name: 'Startup Focused',
      subject: 'Ready to make an impact - {{jobTitle}} at {{company}}',
      body: `Hey {{company}} team!

I'm reaching out about the {{jobTitle}} position because I'm passionate about working with innovative companies like yours.

As a {{role}}, I thrive in fast-paced environments where I can wear multiple hats and make a real impact. I'm excited about the possibility of contributing to {{company}}'s growth and success.

{{notes}}

I've attached my resume and would love to learn more about your vision and how I can help bring it to life.

Thanks for your time!

[Your Name]`
    }
  ]

  for (const template of templates) {
    // Check if template with this name already exists
    const existingTemplate = await prisma.template.findFirst({
      where: { name: template.name }
    })

    if (!existingTemplate) {
      await prisma.template.create({
        data: template
      })
    }
  }

  console.log('✅ Database seeded with default templates')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
