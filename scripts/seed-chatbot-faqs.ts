import { connectToDatabase } from '../lib/db'
import ChatbotFAQ from '../lib/db/models/chatbot-faq.model'
import User from '../lib/db/models/user.model'

const seedFAQs = [
  // Shipping Category
  {
    category: 'Shipping',
    question: {
      en: 'How long does shipping take?',
      kh: 'ការដឹកជញ្ជូនត្រូវការពេលប៉ុន្មាន?',
    },
    answer: {
      en: 'Standard shipping takes 3-5 business days. Express shipping takes 1-2 business days. Please note that delivery times may vary depending on your location.',
      kh: 'ការដឹកជញ្ជូនស្តង់ដារត្រូវការពី 3-5 ថ្ងៃធ្វើការ។ ការដឹកជញ្ជូនលឿនត្រូវការពី 1-2 ថ្ងៃធ្វើការ។ សូមចំណាំថាពេលវេលាដឹកជញ្ជូនអាចប្រែប្រួលអាស្រ័យលើទីតាំងរបស់អ្នក។',
    },
    keywords: ['shipping', 'delivery', 'time', 'fast', 'days', 'how long'],
    order: 1,
    active: true,
  },
  {
    category: 'Shipping',
    question: {
      en: 'Do you ship internationally?',
      kh: 'តើអ្នកដឹកជញ្ជូនទៅបរទេសទេ?',
    },
    answer: {
      en: 'Yes, we ship to most countries worldwide. Shipping costs and delivery times vary by destination. International orders may be subject to customs fees and import duties.',
      kh: 'បាទ/ចាស យើងដឹកជញ្ជូនទៅប្រទេសភាគច្រើននៅទូទាំងពិភពលោក។ ថ្លៃដឹកជញ្ជូននិងពេលវេលាដឹកជញ្ជូនប្រែប្រួលតាមគោលដៅ។ ការបញ្ជាទិញពីបរទេសអាចជាប់ថ្លៃគយនិងពន្ធនាំចូល។',
    },
    keywords: ['international', 'worldwide', 'global', 'shipping', 'abroad'],
    order: 2,
    active: true,
  },
  {
    category: 'Shipping',
    question: {
      en: 'How can I track my order?',
      kh: 'តើខ្ញុំអាចតាមដានការបញ្ជាទិញរបស់ខ្ញុំយ៉ាងដូចម្តេច?',
    },
    answer: {
      en: 'Once your order ships, you will receive a tracking number via email. You can use this number to track your package on our website or the carrier\'s website. You can also check your order status in your account dashboard.',
      kh: 'នៅពេលការបញ្ជាទិញរបស់អ្នកត្រូវបានដឹកជញ្ជូន អ្នកនឹងទទួលបានលេខតាមដានតាមរយៈអ៊ីមែល។ អ្នកអាចប្រើលេខនេះដើម្បីតាមដានកញ្ចប់របស់អ្នកនៅលើគេហទំព័ររបស់យើង ឬគេហទំព័រក្រុមហ៊ុនដឹកជញ្ជូន។ អ្នកក៏អាចពិនិត្យស្ថានភាពការបញ្ជាទិញរបស់អ្នកនៅក្នុងផ្ទាំងគ្រប់គ្រងគណនីរបស់អ្នក។',
    },
    keywords: ['track', 'tracking', 'order status', 'where is my order', 'shipment'],
    order: 3,
    active: true,
  },

  // Returns Category
  {
    category: 'Returns',
    question: {
      en: 'What is your return policy?',
      kh: 'តើគោលការណ៍ត្រឡប់ទំនិញរបស់អ្នកគឺយ៉ាងដូចម្តេច?',
    },
    answer: {
      en: 'We offer a 30-day return policy for most items. Products must be unused, in original packaging, and with all tags attached. Some items like electronics may have different return periods. Please contact our support team to initiate a return.',
      kh: 'យើងផ្តល់គោលការណ៍ត្រឡប់ទំនិញរយៈពេល 30 ថ្ងៃសម្រាប់ផលិតផលភាគច្រើន។ ផលិតផលត្រូវតែមិនទាន់ប្រើប្រាស់ នៅក្នុងកញ្ចប់ដើម និងមានស្លាកទាំងអស់។ ផលិតផលមួយចំនួនដូចជាឧបករណ៍អេឡិចត្រូនិចអាចមានរយៈពេលត្រឡប់ខុសគ្នា។ សូមទាក់ទងក្រុមគាំទ្ររបស់យើងដើម្បីចាប់ផ្តើមការត្រឡប់។',
    },
    keywords: ['return', 'refund', 'exchange', 'send back', 'money back'],
    order: 4,
    active: true,
  },
  {
    category: 'Returns',
    question: {
      en: 'How long does it take to process a refund?',
      kh: 'តើការដំណើរការសងប្រាក់វិញត្រូវការពេលប៉ុន្មាន?',
    },
    answer: {
      en: 'Once we receive your returned item, refunds are processed within 5-7 business days. The refund will be issued to your original payment method. Please allow additional time for your bank to process the refund.',
      kh: 'នៅពេលយើងទទួលបានទំនិញត្រឡប់របស់អ្នក ការសងប្រាក់វិញត្រូវបានដំណើរការក្នុងរយៈពេល 5-7 ថ្ងៃធ្វើការ។ ការសងប្រាក់វិញនឹងត្រូវបានបញ្ជូនទៅវិធីបង់ប្រាក់ដើមរបស់អ្នក។ សូមអនុញ្ញាតពេលវេលាបន្ថែមសម្រាប់ធនាគាររបស់អ្នកដើម្បីដំណើរការការសងប្រាក់វិញ។',
    },
    keywords: ['refund', 'money back', 'process time', 'how long'],
    order: 5,
    active: true,
  },

  // Products Category
  {
    category: 'Products',
    question: {
      en: 'Are all products authentic?',
      kh: 'តើផលិតផលទាំងអស់គឺពិតប្រាកដទេ?',
    },
    answer: {
      en: 'Yes, we guarantee that all products sold on our platform are 100% authentic. We work directly with authorized distributors and brands to ensure product authenticity.',
      kh: 'បាទ/ចាស យើងធានាថាផលិតផលទាំងអស់ដែលលក់នៅលើវេទិការបស់យើងគឺពិតប្រាកដ 100%។ យើងធ្វើការដោយផ្ទាល់ជាមួយអ្នកចែកចាយដែលមានការអនុញ្ញាត និងម៉ាកយីហោដើម្បីធានាភាពត្រឹមត្រូវនៃផលិតផល។',
    },
    keywords: ['authentic', 'genuine', 'real', 'fake', 'original', 'legitimate'],
    order: 6,
    active: true,
  },
  {
    category: 'Products',
    question: {
      en: 'Do you offer warranty on products?',
      kh: 'តើអ្នកផ្តល់ការធានាលើផលិតផលទេ?',
    },
    answer: {
      en: 'Yes, most products come with manufacturer warranties. Warranty periods vary by product and brand. Please check the product description for specific warranty information. We also offer extended warranty options for select items.',
      kh: 'បាទ/ចាស ផលិតផលភាគច្រើនមានការធានាពីក្រុមហ៊ុនផលិត។ រយៈពេលធានាប្រែប្រួលតាមផលិតផលនិងម៉ាក។ សូមពិនិត្យការពិពណ៌នាផលិតផលសម្រាប់ព័ត៌មានធានាជាក់លាក់។ យើងក៏ផ្តល់ជម្រើសការធានាពង្រីកសម្រាប់ផលិតផលជ្រើសរើស។',
    },
    keywords: ['warranty', 'guarantee', 'protection', 'coverage'],
    order: 7,
    active: true,
  },
  {
    category: 'Products',
    question: {
      en: 'How do I know if a product is in stock?',
      kh: 'តើខ្ញុំដឹងយ៉ាងដូចម្តេចថាផលិតផលមាននៅក្នុងស្តុក?',
    },
    answer: {
      en: 'Product availability is shown on each product page. If a product is out of stock, you can sign up for email notifications to be alerted when it becomes available again. Stock levels are updated in real-time.',
      kh: 'ភាពអាចរកបាននៃផលិតផលត្រូវបានបង្ហាញនៅលើទំព័រផលិតផលនីមួយៗ។ ប្រសិនបើផលិតផលអស់ស្តុក អ្នកអាចចុះឈ្មោះសម្រាប់ការជូនដំណឹងតាមអ៊ីមែលដើម្បីត្រូវបានជូនដំណឹងនៅពេលវាមានម្តងទៀត។ កម្រិតស្តុកត្រូវបានធ្វើបច្ចុប្បន្នភាពក្នុងពេលវេលាពិតប្រាកដ។',
    },
    keywords: ['stock', 'availability', 'in stock', 'out of stock', 'available'],
    order: 8,
    active: true,
  },

  // Payment Category
  {
    category: 'Payment',
    question: {
      en: 'What payment methods do you accept?',
      kh: 'តើអ្នកទទួលយកវិធីបង់ប្រាក់អ្វីខ្លះ?',
    },
    answer: {
      en: 'We accept major credit cards (Visa, MasterCard, American Express), PayPal, Apple Pay, Google Pay, and bank transfers. All payments are processed securely through encrypted connections.',
      kh: 'យើងទទួលយកកាតឥណទានសំខាន់ៗ (Visa, MasterCard, American Express), PayPal, Apple Pay, Google Pay និងការផ្ទេរប្រាក់តាមធនាគារ។ ការបង់ប្រាក់ទាំងអស់ត្រូវបានដំណើរការដោយសុវត្ថិភាពតាមរយៈការតភ្ជាប់ដែលបានអ៊ិនគ្រីប។',
    },
    keywords: ['payment', 'pay', 'credit card', 'paypal', 'payment methods'],
    order: 9,
    active: true,
  },
  {
    category: 'Payment',
    question: {
      en: 'Is my payment information secure?',
      kh: 'តើព័ត៌មានបង់ប្រាក់របស់ខ្ញុំមានសុវត្ថិភាពទេ?',
    },
    answer: {
      en: 'Yes, absolutely! We use industry-standard SSL encryption to protect your payment information. We never store your full credit card details on our servers. All transactions are processed through secure payment gateways.',
      kh: 'បាទ/ចាស ពិតណាស់! យើងប្រើការអ៊ិនគ្រីប SSL តាមស្តង់ដារឧស្សាហកម្មដើម្បីការពារព័ត៌មានបង់ប្រាក់របស់អ្នក។ យើងមិនដែលរក្សាទុកព័ត៌មានលម្អិតកាតឥណទានពេញលេញរបស់អ្នកនៅលើម៉ាស៊ីនមេរបស់យើងទេ។ ប្រតិបត្តិការទាំងអស់ត្រូវបានដំណើរការតាមរយៈច្រកចេញចូលបង់ប្រាក់ដែលមានសុវត្ថិភាព។',
    },
    keywords: ['secure', 'safe', 'security', 'encryption', 'protected', 'ssl'],
    order: 10,
    active: true,
  },
  {
    category: 'Payment',
    question: {
      en: 'Can I pay in installments?',
      kh: 'តើខ្ញុំអាចបង់ជាដុំៗបានទេ?',
    },
    answer: {
      en: 'Yes, we offer installment payment options through selected payment providers for orders above a certain amount. Available installment plans will be shown at checkout.',
      kh: 'បាទ/ចាស យើងផ្តល់ជម្រើសបង់ប្រាក់ជាដុំៗតាមរយៈអ្នកផ្តល់សេវាបង់ប្រាក់ដែលបានជ្រើសរើសសម្រាប់ការបញ្ជាទិញលើសពីចំនួនជាក់លាក់។ ផែនការបង់ប្រាក់ជាដុំៗដែលមាននឹងត្រូវបានបង្ហាញនៅពេលទូទាត់។',
    },
    keywords: ['installment', 'payment plan', 'monthly', 'pay later'],
    order: 11,
    active: true,
  },

  // Account Category
  {
    category: 'Account',
    question: {
      en: 'How do I create an account?',
      kh: 'តើខ្ញុំបង្កើតគណនីយ៉ាងដូចម្តេច?',
    },
    answer: {
      en: 'Click the "Sign Up" button in the top right corner of the website. Fill in your email, create a password, and provide basic information. You can also sign up using your Google account for faster registration.',
      kh: 'ចុចប៊ូតុង "ចុះឈ្មោះ" នៅជ្រុងខាងស្តាំខាងលើនៃគេហទំព័រ។ បំពេញអ៊ីមែលរបស់អ្នក បង្កើតពាក្យសម្ងាត់ និងផ្តល់ព័ត៌មានមូលដ្ឋាន។ អ្នកក៏អាចចុះឈ្មោះដោយប្រើគណនី Google របស់អ្នកសម្រាប់ការចុះឈ្មោះលឿនជាង។',
    },
    keywords: ['account', 'sign up', 'register', 'create account', 'join'],
    order: 12,
    active: true,
  },
  {
    category: 'Account',
    question: {
      en: 'I forgot my password. What should I do?',
      kh: 'ខ្ញុំភ្លេចពាក្យសម្ងាត់របស់ខ្ញុំ។ តើខ្ញុំគួរធ្វើអ្វី?',
    },
    answer: {
      en: 'Click on "Forgot Password" on the login page. Enter your email address, and we will send you a link to reset your password. Check your spam folder if you don\'t see the email within a few minutes.',
      kh: 'ចុចលើ "ភ្លេចពាក្យសម្ងាត់" នៅលើទំព័រចូល។ បញ្ចូលអាសយដ្ឋានអ៊ីមែលរបស់អ្នក ហើយយើងនឹងផ្ញើតំណភ្ជាប់មកអ្នកដើម្បីកំណត់ពាក្យសម្ងាត់របស់អ្នកឡើងវិញ។ ពិនិត្យថតសារឥតបានការប្រសិនបើអ្នកមិនឃើញអ៊ីមែលក្នុងរយៈពេលប៉ុន្មាននាទី។',
    },
    keywords: ['forgot password', 'reset password', 'password recovery', 'lost password'],
    order: 13,
    active: true,
  },
  {
    category: 'Account',
    question: {
      en: 'How do I update my shipping address?',
      kh: 'តើខ្ញុំធ្វើបច្ចុប្បន្នភាពអាសយដ្ឋានដឹកជញ្ជូនរបស់ខ្ញុំយ៉ាងដូចម្តេច?',
    },
    answer: {
      en: 'Log in to your account, go to "Account Settings", and select "Addresses". You can add, edit, or delete shipping addresses. You can also update your address during checkout before placing an order.',
      kh: 'ចូលទៅក្នុងគណនីរបស់អ្នក ទៅកាន់ "ការកំណត់គណនី" និងជ្រើសរើស "អាសយដ្ឋាន"។ អ្នកអាចបន្ថែម កែសម្រួល ឬលុបអាសយដ្ឋានដឹកជញ្ជូន។ អ្នកក៏អាចធ្វើបច្ចុប្បន្នភាពអាសយដ្ឋានរបស់អ្នកអំឡុងពេលទូទាត់មុនពេលធ្វើការបញ្ជាទិញ។',
    },
    keywords: ['address', 'shipping address', 'update address', 'change address'],
    order: 14,
    active: true,
  },

  // Support Category
  {
    category: 'Support',
    question: {
      en: 'How can I contact customer support?',
      kh: 'តើខ្ញុំអាចទាក់ទងផ្នែកគាំទ្រអតិថិជនយ៉ាងដូចម្តេច?',
    },
    answer: {
      en: 'You can reach us via email at support@example.com, call us at 1-800-123-4567, or use the live chat feature on our website. Our support team is available Monday to Friday, 9 AM to 6 PM.',
      kh: 'អ្នកអាចទាក់ទងយើងតាមរយៈអ៊ីមែលនៅ support@example.com ហៅមកយើងនៅ 1-800-123-4567 ឬប្រើមុខងារជជែកផ្ទាល់នៅលើគេហទំព័ររបស់យើង។ ក្រុមគាំទ្ររបស់យើងមាននៅថ្ងៃច័ន្ទដល់ថ្ងៃសុក្រ ម៉ោង 9 ព្រឹក ដល់ 6 ល្ងាច។',
    },
    keywords: ['contact', 'support', 'help', 'customer service', 'reach'],
    order: 15,
    active: true,
  },
]

async function seed() {
  try {
    console.log('🌱 Starting chatbot FAQ seeding...')

    await connectToDatabase()
    console.log('✅ Connected to database')

    // Find an admin user to assign as creator
    const adminUser = await User.findOne({ role: /^admin$/i }).select('_id')
    
    if (!adminUser) {
      console.log('⚠️  No admin user found. FAQs will be created without a creator.')
    }

    // Clear existing FAQs
    const deleteResult = await ChatbotFAQ.deleteMany({})
    console.log(`🗑️  Deleted ${deleteResult.deletedCount} existing FAQs`)

    // Insert seed FAQs
    const faqsToInsert = seedFAQs.map(faq => ({
      ...faq,
      createdBy: adminUser?._id,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
    }))

    const insertedFAQs = await ChatbotFAQ.insertMany(faqsToInsert)
    console.log(`✅ Inserted ${insertedFAQs.length} FAQs`)

    // Summary by category
    const categoryCounts = seedFAQs.reduce((acc, faq) => {
      acc[faq.category] = (acc[faq.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    console.log('\n📊 FAQs by category:')
    Object.entries(categoryCounts).forEach(([category, count]) => {
      console.log(`   - ${category}: ${count} FAQs`)
    })

    console.log('\n🎉 Chatbot FAQ seeding completed successfully!')
    console.log('\n💡 Next steps:')
    console.log('   1. Go to http://localhost:3003/admin/chatbot to view FAQs')
    console.log('   2. Click the chatbot button on the storefront to test')
    console.log('   3. Try searching for keywords like "shipping", "return", "payment"')

    process.exit(0)
  } catch (error) {
    console.error('❌ Error seeding chatbot FAQs:', error)
    process.exit(1)
  }
}

seed()
