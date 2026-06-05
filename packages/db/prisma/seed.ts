import { PrismaClient, AuthProvider, Role, StoryStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Clean existing data
  await prisma.readingProgress.deleteMany()
  await prisma.page.deleteMany()
  await prisma.chapter.deleteMany()
  await prisma.storyGenre.deleteMany()
  await prisma.story.deleteMany()
  await prisma.user.deleteMany()

  // Admin user
  const adminPw = await bcrypt.hash('admin123', 12)
  const admin = await prisma.user.create({
    data: {
      email: 'admin@truyen.dev',
      password: adminPw,
      name: 'Admin',
      role: Role.ADMIN,
      dob: new Date('1990-01-01'),
      isAgeVerified: true,
    }
  })

  // Regular user
  const userPw = await bcrypt.hash('user123', 12)
  const user = await prisma.user.create({
    data: {
      email: 'user@truyen.dev',
      password: userPw,
      name: 'Người Đọc',
      dob: new Date('1990-06-15'),
      isAgeVerified: true,
    }
  })

  // Story 1: Kiếm Hiệp (3 chapters, 5 pages each)
  const story1 = await prisma.story.create({
    data: {
      title: 'Thiên Long Bát Bộ',
      slug: 'thien-long-bat-bo',
      description: 'Một câu chuyện kiếm hiệp huyền thoại về tình nghĩa giang hồ và những cuộc phiêu lưu kỳ thú.',
      status: StoryStatus.ONGOING,
      isAdult: false,
      genres: { create: [{ genre: 'martial_arts' }, { genre: 'fantasy' }] },
    }
  })

  for (let chNum = 1; chNum <= 3; chNum++) {
    const ch = await prisma.chapter.create({
      data: {
        storyId: story1.id,
        number: chNum,
        title: `Chương ${chNum}: ${['Khởi Đầu', 'Kỳ Ngộ', 'Đại Chiến'][chNum - 1]}`,
      }
    })
    for (let pgNum = 1; pgNum <= 5; pgNum++) {
      await prisma.page.create({
        data: {
          chapterId: ch.id,
          number: pgNum,
          content: generateContent(story1.title, chNum, pgNum),
        }
      })
    }
  }

  // Story 2: Kinh Dị (2 chapters, 3 pages each)
  const story2 = await prisma.story.create({
    data: {
      title: 'Ngôi Nhà Bị Nguyền Rủa',
      slug: 'ngoi-nha-bi-nguyen-rua',
      description: 'Một ngôi nhà cũ ẩn chứa bí mật đen tối. Không ai bước vào mà còn có thể trở ra nguyên vẹn.',
      status: StoryStatus.ONGOING,
      isAdult: false,
      genres: { create: [{ genre: 'horror' }] },
    }
  })

  for (let chNum = 1; chNum <= 2; chNum++) {
    const ch = await prisma.chapter.create({
      data: {
        storyId: story2.id,
        number: chNum,
        title: `Chương ${chNum}: ${['Bóng Tối', 'Tiếng Thì Thầm'][chNum - 1]}`,
      }
    })
    for (let pgNum = 1; pgNum <= 3; pgNum++) {
      await prisma.page.create({
        data: {
          chapterId: ch.id,
          number: pgNum,
          content: generateContent(story2.title, chNum, pgNum),
        }
      })
    }
  }

  // Story 3: 18+ Ngôn Tình
  const story3 = await prisma.story.create({
    data: {
      title: 'Yêu Em Từ Cái Nhìn Đầu Tiên',
      slug: 'yeu-em-tu-cai-nhin-dau-tien',
      description: 'Câu chuyện tình yêu lãng mạn dành cho độc giả trưởng thành.',
      status: StoryStatus.ONGOING,
      isAdult: true,
      genres: { create: [{ genre: 'romance' }, { genre: 'adult' }] },
    }
  })

  for (let chNum = 1; chNum <= 2; chNum++) {
    const ch = await prisma.chapter.create({
      data: {
        storyId: story3.id,
        number: chNum,
        title: `Chương ${chNum}`,
      }
    })
    for (let pgNum = 1; pgNum <= 4; pgNum++) {
      await prisma.page.create({
        data: {
          chapterId: ch.id,
          number: pgNum,
          content: generateContent(story3.title, chNum, pgNum),
        }
      })
    }
  }

  // Reading progress for the regular user on story 1
  const ch1 = await prisma.chapter.findFirst({ where: { storyId: story1.id, number: 1 } })
  if (ch1) {
    await prisma.readingProgress.create({
      data: {
        userId: user.id,
        storyId: story1.id,
        chapterId: ch1.id,
        pageNumber: 3,
      }
    })
  }

  console.log('Seed completed:', {
    users: 2,
    stories: 3,
    admin: admin.email,
    user: user.email,
  })
}

function generateContent(title: string, chapter: number, page: number): string {
  return `${title} — Chương ${chapter}, Trang ${page}

Đây là nội dung minh họa cho trang ${page} của chương ${chapter}.

Trong một buổi chiều tà, ánh nắng vàng nhạt chiếu qua những tán lá xanh mướt. Gió thổi nhẹ nhàng, mang theo hương thơm của hoa dại. Nhân vật chính bước đi trên con đường mòn quen thuộc, lòng chợt dâng lên bao cảm xúc khó tả.

"Hành trình vạn dặm bắt đầu từ một bước chân," anh ta tự nhủ, mắt nhìn về phía chân trời xa xăm.

Tiếng chim hót líu lo xen lẫn tiếng suối chảy róc rách tạo nên bản nhạc thiên nhiên du dương. Xung quanh, cỏ cây hoa lá đua nhau khoe sắc trong ánh chiều tà. Cảnh vật thật bình yên và tĩnh lặng, như thể mọi lo toan trần thế đều tan biến.

Đây chính là khoảnh khắc mà anh ta luôn trân trọng — khoảnh khắc được sống trong thế giới riêng của mình, nơi không có tranh giành, không có thù hận, chỉ có sự bình yên trong tâm hồn.

Nhưng anh ta biết rằng, khoảnh khắc bình yên này sẽ không kéo dài mãi. Phía trước vẫn còn nhiều thử thách đang chờ đón. Hành trình của anh ta còn dài, và anh ta phải sẵn sàng đối mặt với tất cả.

(Tiếp tục ở trang ${page + 1}...)`.trim()
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
