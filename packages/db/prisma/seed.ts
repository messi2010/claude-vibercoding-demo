import { PrismaClient, AuthProvider, Role, StoryStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// ---------------------------------------------------------------------------
// Story catalogue — 40 entries across all genres
// ---------------------------------------------------------------------------

interface StorySeed {
  title: string
  slug: string
  description: string
  genres: string[]
  status: StoryStatus
  isAdult: boolean
  chapters: number   // how many chapters to generate
  pagesPerChapter: number
}

const STORIES: StorySeed[] = [
  // ── Huyền Huyễn ──────────────────────────────────────────────────────────
  {
    title: 'Đấu Phá Thương Khung',
    slug: 'dau-pha-thuong-khung',
    description: 'Tiêu Viêm — một thiên tài một thời nay trở thành phế vật. Nhưng sau khi gặp được hồn phách của tổ tiên trong chiếc nhẫn cổ, anh bắt đầu hành trình khổ luyện đỉnh cao của thế giới đấu khí, vượt qua mọi thế lực để trở thành Đấu Đế huyền thoại.',
    genres: ['fantasy'],
    status: StoryStatus.ONGOING,
    isAdult: false,
    chapters: 20,
    pagesPerChapter: 4,
  },
  {
    title: 'Vạn Cổ Thần Đế',
    slug: 'van-co-than-de',
    description: 'Thanh Dương — linh hồn từ kiếp trước chứa đựng ký ức của Thần Đế bậc nhất vũ trụ. Tái sinh vào thân xác một thiếu niên tài năng, anh mang theo bí kíp của Thần Đạo tiến lên con đường vô cực.',
    genres: ['fantasy'],
    status: StoryStatus.ONGOING,
    isAdult: false,
    chapters: 25,
    pagesPerChapter: 3,
  },
  {
    title: 'Phàm Nhân Tu Tiên',
    slug: 'pham-nhan-tu-tien',
    description: 'Hàn Lập — một đứa trẻ nghèo không có linh căn đặc biệt, nhưng nhờ sự kiên trì và một lọ thuốc bí ẩn có thể tăng tốc sinh trưởng dược liệu, từng bước leo lên đỉnh cao của thế giới tu tiên.',
    genres: ['fantasy'],
    status: StoryStatus.COMPLETED,
    isAdult: false,
    chapters: 30,
    pagesPerChapter: 4,
  },
  {
    title: 'Tiên Nghịch',
    slug: 'tien-nghich',
    description: 'Vương Lâm sinh ra trong gia đình bình thường, tư chất tu luyện tầm thường. Tuy nhiên một cơ duyên tình cờ cho anh tiếp cận với Vô Danh Tu Tiên Kinh bí ẩn — bắt đầu hành trình chống lại số mệnh.',
    genres: ['fantasy'],
    status: StoryStatus.ONGOING,
    isAdult: false,
    chapters: 18,
    pagesPerChapter: 4,
  },
  {
    title: 'Đại Chúa Tể',
    slug: 'dai-chu-te',
    description: 'Mục Trần — từ một thiếu niên vô danh ở vùng đất hoang dã, nhờ tu luyện Cửu Long Quy ẩn trong thân, từng bước trở thành Đại Chúa Tể ngự trị cả Linh Thiên Cảnh.',
    genres: ['fantasy'],
    status: StoryStatus.ONGOING,
    isAdult: false,
    chapters: 22,
    pagesPerChapter: 3,
  },
  {
    title: 'Võ Thần Không Gian',
    slug: 'vo-than-khong-gian',
    description: 'Dương Khai sở hữu không gian bí ẩn có thể lưu trữ vật phẩm và tăng tốc thời gian. Với bảo bối độc đáo này, anh nuôi linh thú, trồng linh thảo và trở thành võ thần vô địch thiên hạ.',
    genres: ['fantasy'],
    status: StoryStatus.COMPLETED,
    isAdult: false,
    chapters: 15,
    pagesPerChapter: 3,
  },
  {
    title: 'Tu Chân Tứ Vạn Niên',
    slug: 'tu-chan-tu-van-nien',
    description: 'Sau bốn vạn năm tu luyện trong cô độc, Linh Tuyền đã chứng kiến sự hưng vong của bao triều đại, bao tiên nhân xuất thế rồi lại biến mất. Đến khi thiên địa đại kiếp đến gần, ông một mình đứng trước cả vũ trụ.',
    genres: ['fantasy'],
    status: StoryStatus.COMPLETED,
    isAdult: false,
    chapters: 12,
    pagesPerChapter: 5,
  },
  {
    title: 'Hỗn Độn Kiếm Thần',
    slug: 'hon-don-kiem-than',
    description: 'Linh Vân vô tình có được mảnh vỡ của Hỗn Độn Kiếm — thanh kiếm huyền thoại có trước cả vũ trụ. Từ đó, anh bước vào con đường kiếm đạo vô thượng, một kiếm chặt đứt thiên địa.',
    genres: ['fantasy', 'martial_arts'],
    status: StoryStatus.ONGOING,
    isAdult: false,
    chapters: 16,
    pagesPerChapter: 4,
  },
  {
    title: 'Linh Khí Phục Tô',
    slug: 'linh-khi-phuc-to',
    description: 'Năm 2045, linh khí đột ngột phục hồi trên Trái Đất. Con người bắt đầu tu luyện, dị thú xuất hiện, và cánh cổng dẫn đến các thế giới khác mở ra. Trần Mặc — người đầu tiên giác thức — đứng trước bình minh của kỷ nguyên mới.',
    genres: ['fantasy'],
    status: StoryStatus.ONGOING,
    isAdult: false,
    chapters: 14,
    pagesPerChapter: 3,
  },
  {
    title: 'Thần Cấp Thăng Cấp Hệ Thống',
    slug: 'than-cap-thang-cap-he-thong',
    description: 'Lý Mặc sau khi chết được hệ thống cấp độ thần cấp chọn làm vật chủ. Mỗi lần hoàn thành nhiệm vụ, anh nhận được điểm kinh nghiệm và nâng cấp kỹ năng. Hành trình bắt đầu từ lv.1 đến vô hạn.',
    genres: ['fantasy'],
    status: StoryStatus.ONGOING,
    isAdult: false,
    chapters: 20,
    pagesPerChapter: 3,
  },

  // ── Kiếm Hiệp ────────────────────────────────────────────────────────────
  {
    title: 'Thiên Long Bát Bộ',
    slug: 'thien-long-bat-bo',
    description: 'Một câu chuyện kiếm hiệp huyền thoại về tình nghĩa giang hồ và những cuộc phiêu lưu kỳ thú. Tiêu Phong, Hư Trúc, Đoàn Dự — ba nhân vật với số phận giao thoa trong bối cảnh loạn lạc thời Tống.',
    genres: ['martial_arts', 'fantasy'],
    status: StoryStatus.ONGOING,
    isAdult: false,
    chapters: 3,
    pagesPerChapter: 5,
  },
  {
    title: 'Lộc Đỉnh Ký',
    slug: 'loc-dinh-ky',
    description: 'Vi Tiểu Bảo — một gã lưu manh không biết võ công, không có tư cách anh hùng, lại bằng tài ứng xử khéo léo và vận may trời ban mà lên đến tột đỉnh quyền thế. Tiểu thuyết kỳ đặc nhất của Kim Dung.',
    genres: ['martial_arts'],
    status: StoryStatus.COMPLETED,
    isAdult: false,
    chapters: 25,
    pagesPerChapter: 4,
  },
  {
    title: 'Tiếu Ngạo Giang Hồ',
    slug: 'tieu-ngao-giang-ho',
    description: 'Lệnh Hồ Xung — một đệ tử Hoa Sơn phái phóng khoáng, bị hiểu lầm và xua đuổi, nhưng tâm hồn tự do không bị ràng buộc bởi danh lợi. Bản tình ca của tự do giữa chốn giang hồ đầy tranh đoạt.',
    genres: ['martial_arts'],
    status: StoryStatus.COMPLETED,
    isAdult: false,
    chapters: 20,
    pagesPerChapter: 4,
  },
  {
    title: 'Anh Hùng Xạ Điêu',
    slug: 'anh-hung-xa-dieu',
    description: 'Quách Tĩnh — chàng trai chất phác sinh ra ở thảo nguyên Mông Cổ, từng bước trở thành đại hiệp qua khổ luyện và tình yêu với Hoàng Dung thông minh tuyệt đỉnh. Bộ ba kinh điển bắt đầu từ đây.',
    genres: ['martial_arts'],
    status: StoryStatus.COMPLETED,
    isAdult: false,
    chapters: 22,
    pagesPerChapter: 4,
  },
  {
    title: 'Độc Cô Cầu Bại',
    slug: 'doc-co-cau-bai',
    description: 'Truyền thuyết về kiếm khách cô đơn nhất giang hồ — Độc Cô Cầu Bại, người đã đạt đến cảnh giới vô kiếm thắng hữu kiếm và không còn đối thủ xứng tầm trên thiên hạ. Một bi kịch về sự cô đơn đỉnh cao.',
    genres: ['martial_arts'],
    status: StoryStatus.COMPLETED,
    isAdult: false,
    chapters: 10,
    pagesPerChapter: 5,
  },
  {
    title: 'Võ Lâm Ngũ Bá',
    slug: 'vo-lam-ngu-ba',
    description: 'Năm bá chủ của võ lâm, năm con đường, năm số phận. Khi thiên hạ đệ nhất bảo vật xuất thế, giang hồ dậy sóng. Ai sẽ là người cuối cùng đứng trên đỉnh thiên hạ?',
    genres: ['martial_arts'],
    status: StoryStatus.ONGOING,
    isAdult: false,
    chapters: 18,
    pagesPerChapter: 4,
  },
  {
    title: 'Kiếm Đến Vô Cực',
    slug: 'kiem-den-vo-cuc',
    description: 'Từ một tiểu tốt không tên tuổi, Vân Phi học được Thiên Nhai Kiếm Pháp trên vách núi tuyết. Một mình đơn kiếm, anh đi qua trăm trận, đối mặt với tà ma, trả mối thù cũ, bảo vệ những người mình yêu.',
    genres: ['martial_arts'],
    status: StoryStatus.ONGOING,
    isAdult: false,
    chapters: 16,
    pagesPerChapter: 3,
  },
  {
    title: 'Ma Đạo Tổ Sư',
    slug: 'ma-dao-to-su',
    description: 'Ngụy Vô Tiện, một tu tiên giả đã chết và được tái sinh, bắt đầu hành trình mới đầy bí ẩn và nguy hiểm trong thế giới tiên ma đan xen.',
    genres: ['fantasy', 'martial_arts'],
    status: StoryStatus.ONGOING,
    isAdult: false,
    chapters: 1,
    pagesPerChapter: 3,
  },

  // ── Kinh Dị ───────────────────────────────────────────────────────────────
  {
    title: 'Ngôi Nhà Bị Nguyền Rủa',
    slug: 'ngoi-nha-bi-nguyen-rua',
    description: 'Một ngôi nhà cũ ẩn chứa bí mật đen tối. Không ai bước vào mà còn có thể trở ra nguyên vẹn.',
    genres: ['horror'],
    status: StoryStatus.ONGOING,
    isAdult: false,
    chapters: 2,
    pagesPerChapter: 3,
  },
  {
    title: 'Ký Sự Diệt Quỷ',
    slug: 'ky-su-diet-quy',
    description: 'Đặng Minh — thám tử chuyên điều tra các vụ án liên quan đến thế giới tâm linh. Mỗi vụ án là một bí ẩn ghê rợn hơn, và ranh giới giữa thế giới người và quỷ ngày càng mờ nhạt.',
    genres: ['horror'],
    status: StoryStatus.ONGOING,
    isAdult: false,
    chapters: 12,
    pagesPerChapter: 4,
  },
  {
    title: 'Đêm Không Bình Yên',
    slug: 'dem-khong-binh-yen',
    description: 'Một ngôi làng nhỏ nơi mỗi đêm đều có người mất tích. Ký ức của dân làng bị xóa theo từng bình minh. Phóng viên Hà Linh đến điều tra và dần nhận ra cô không thể rời đi nữa.',
    genres: ['horror'],
    status: StoryStatus.COMPLETED,
    isAdult: false,
    chapters: 8,
    pagesPerChapter: 4,
  },
  {
    title: 'Bức Tranh Biết Thở',
    slug: 'buc-tranh-biet-tho',
    description: 'Một bức tranh sơn dầu cổ mua từ phiên đấu giá bí ẩn. Mỗi đêm, nhân vật trong tranh thay đổi vị trí. Chủ nhân của nó bắt đầu thấy những thứ mà người khác không thấy.',
    genres: ['horror'],
    status: StoryStatus.COMPLETED,
    isAdult: false,
    chapters: 6,
    pagesPerChapter: 4,
  },
  {
    title: 'Trại Tâm Thần',
    slug: 'trai-tam-than',
    description: 'Một bác sĩ trẻ nhận nhiệm vụ đến trại tâm thần xa xôi để kiểm tra. Anh phát hiện bệnh nhân ở đây nói những điều không thể là ảo giác — chúng là sự thật kinh hoàng.',
    genres: ['horror'],
    status: StoryStatus.ONGOING,
    isAdult: false,
    chapters: 10,
    pagesPerChapter: 4,
  },
  {
    title: 'Tiếng Gọi Từ Đáy Biển',
    slug: 'tieng-goi-tu-day-bien',
    description: 'Đội thám hiểm đáy biển thu được tín hiệu lạ từ vực sâu 11.000 mét. Khi lặn xuống, họ tìm thấy thứ không thuộc về thế giới này — và nó đã biết họ đến.',
    genres: ['horror'],
    status: StoryStatus.COMPLETED,
    isAdult: false,
    chapters: 7,
    pagesPerChapter: 5,
  },
  {
    title: 'Con Búp Bê',
    slug: 'con-bup-be',
    description: 'Một con búp bê cổ truyền tay từ thế hệ này sang thế hệ khác trong gia đình họ Trần. Những đứa trẻ sở hữu nó đều biến mất khi tròn 10 tuổi. Và giờ đến lượt bé Lan.',
    genres: ['horror'],
    status: StoryStatus.COMPLETED,
    isAdult: false,
    chapters: 5,
    pagesPerChapter: 4,
  },

  // ── Ngôn Tình ────────────────────────────────────────────────────────────
  {
    title: 'Yêu Em Từ Cái Nhìn Đầu Tiên',
    slug: 'yeu-em-tu-cai-nhin-dau-tien',
    description: 'Câu chuyện tình yêu lãng mạn dành cho độc giả trưởng thành về hai con người tưởng chừng trái ngược nhau nhưng lại có sức hút không thể cưỡng lại.',
    genres: ['romance', 'adult'],
    status: StoryStatus.ONGOING,
    isAdult: true,
    chapters: 2,
    pagesPerChapter: 4,
  },
  {
    title: 'Hôn Nhân Hợp Đồng',
    slug: 'hon-nhan-hop-dong',
    description: 'Lâm Hiểu và Cố Trạch — hai người xa lạ bị ép kết hôn theo thỏa thuận gia đình. Họ thề sẽ ly hôn sau một năm. Nhưng khi năm đó gần kết thúc, cả hai đều không còn chắc về quyết định của mình.',
    genres: ['romance'],
    status: StoryStatus.COMPLETED,
    isAdult: false,
    chapters: 15,
    pagesPerChapter: 3,
  },
  {
    title: 'Tổng Tài Lạnh Lùng Yêu Mãnh Liệt',
    slug: 'tong-tai-lanh-lung-yeu-manh-liet',
    description: 'Mạn Vân — cô gái bình thường tình cờ cứu một người đàn ông giàu có. Anh ta lạnh lùng, quyền lực, và bí ẩn. Cô không ngờ rằng sự tử tế nhỏ nhoi đó lại khiến anh theo đuổi cô đến cùng.',
    genres: ['romance'],
    status: StoryStatus.ONGOING,
    isAdult: false,
    chapters: 20,
    pagesPerChapter: 3,
  },
  {
    title: 'Mùa Hè Không Quên',
    slug: 'mua-he-khong-quen',
    description: 'Hai đứa trẻ hàng xóm chia tay nhau khi còn nhỏ vì gia đình chuyển nhà. Mười lăm năm sau, họ gặp lại trong một buổi họp lớp. Ký ức ùa về, và cả hai nhận ra cảm xúc ngày xưa chưa bao giờ biến mất.',
    genres: ['romance'],
    status: StoryStatus.COMPLETED,
    isAdult: false,
    chapters: 10,
    pagesPerChapter: 3,
  },
  {
    title: 'Yêu Trong Lặng Thầm',
    slug: 'yeu-trong-lang-tham',
    description: 'Ngọc Hà yêu người bạn thân của mình đã 7 năm mà chưa dám nói. Khi anh ta thông báo sắp kết hôn với người khác, cô phải đối mặt với lựa chọn: tiếp tục im lặng hay nói ra sự thật lần cuối.',
    genres: ['romance'],
    status: StoryStatus.COMPLETED,
    isAdult: false,
    chapters: 8,
    pagesPerChapter: 3,
  },
  {
    title: 'Cà Phê Và Mưa',
    slug: 'ca-phe-va-mua',
    description: 'Một quán cà phê nhỏ trên con phố mưa thường xuyên. Người chủ quán trầm lặng và cô khách hàng hay ghé vào trú mưa mỗi chiều. Tình yêu đôi khi bắt đầu từ những điều giản dị nhất.',
    genres: ['romance'],
    status: StoryStatus.COMPLETED,
    isAdult: false,
    chapters: 6,
    pagesPerChapter: 4,
  },
  {
    title: 'Vợ Sếp Không Phải Chuyện Đùa',
    slug: 'vo-sep-khong-phai-chuyen-dun',
    description: 'Thư ký mới của tổng giám đốc tập đoàn lớn nhất thành phố không ngờ rằng cô vừa ký hợp đồng làm việc với người chồng sắp cưới của mình — người mà cô chưa bao giờ gặp mặt.',
    genres: ['romance'],
    status: StoryStatus.ONGOING,
    isAdult: false,
    chapters: 18,
    pagesPerChapter: 3,
  },
  {
    title: 'Ngọt Ngào Tháng Ba',
    slug: 'ngot-ngao-thang-ba',
    description: 'Nhà văn trẻ đang trải qua khủng hoảng sáng tác thuê căn hộ ở một thị trấn nhỏ yên tĩnh. Người hàng xóm — một thầy giáo dạy nhạc — dần trở thành nguồn cảm hứng bất ngờ cho cô.',
    genres: ['romance'],
    status: StoryStatus.COMPLETED,
    isAdult: false,
    chapters: 9,
    pagesPerChapter: 4,
  },

  // ── Adult / 18+ ──────────────────────────────────────────────────────────
  {
    title: 'Đêm Muộn',
    slug: 'dem-muon',
    description: 'Câu chuyện tình yêu dành cho người trưởng thành về những lựa chọn, ham muốn và ranh giới mỏng manh giữa lý trí và cảm xúc. Chỉ dành cho độc giả 18+.',
    genres: ['romance', 'adult'],
    status: StoryStatus.ONGOING,
    isAdult: true,
    chapters: 12,
    pagesPerChapter: 4,
  },
  {
    title: 'Trò Chơi Quyền Lực',
    slug: 'tro-choi-quyen-luc',
    description: 'Trong thế giới thượng lưu đầy cám dỗ, ranh giới giữa yêu đương và toan tính trở nên mờ nhạt. Một cuộc tình đầy đam mê và nguy hiểm giữa hai người đang chơi cùng một ván cờ. Nội dung 18+.',
    genres: ['romance', 'adult'],
    status: StoryStatus.ONGOING,
    isAdult: true,
    chapters: 15,
    pagesPerChapter: 3,
  },
  {
    title: 'Bí Mật Sau Cánh Cửa',
    slug: 'bi-mat-sau-canh-cua',
    description: 'Nhà tâm lý học trẻ vô tình phát hiện bí mật của người hàng xóm bí ẩn. Mỗi đêm sau cánh cửa đóng kín đó là cả một thế giới cô chưa từng biết đến. Dành cho độc giả 18+.',
    genres: ['romance', 'adult'],
    status: StoryStatus.COMPLETED,
    isAdult: true,
    chapters: 10,
    pagesPerChapter: 4,
  },
]

// ---------------------------------------------------------------------------
// Content generators per genre
// ---------------------------------------------------------------------------

const FANTASY_PARAGRAPHS = [
  'Linh khí cuồn cuộn tụ về, thiên địa biến sắc. Tiếng sét vang dội khắp hư không, ánh chớp xẻ đôi bầu trời u ám.',
  '"Cảnh giới này, ta đã chờ đợi một nghìn năm," giọng nói trầm thấp vang lên, ẩn chứa uy lực của bậc cổ thần.',
  'Đan điền vỡ toang, nguyên thần bừng sáng. Cảnh giới Nguyên Anh — đây chính là bước ngoặt mà anh đã mơ ước bao năm tháng.',
  'Linh thú cấp chín gầm lên, rừng sâu chao đảo. Hàng vạn con thú nhỏ tháo chạy tán loạn, bỏ lại bãi đất hoang vắng.',
  'Thiên đạo vô tình, tu sĩ phải đấu tranh mới có thể tiến lên. Anh hiểu điều đó hơn ai hết sau những năm tháng cô đơn luyện tập.',
  'Bí kíp hiện ra trong đầu như một dòng sông ánh sáng. Từng chữ từng câu đều ẩn chứa đạo lý sâu xa của tiền nhân.',
  'Kiếm khí bao trùm trăm dặm, núi đồi rung chuyển. Một chiêu kiếm pháp này có thể chặt đứt thiên hà.',
]

const MARTIAL_PARAGRAPHS = [
  'Kiếm phong rít lên như tiếng long ngâm, mỗi chiêu thức đều mang trong mình cả một đời tâm huyết của người luyện.',
  '"Giang hồ hiểm ác, người không hại ta, ta không hại người. Nhưng nếu ai dám đụng đến người ta thương..." — anh chưa nói hết, nhưng ai cũng hiểu ý.',
  'Một chiêu "Phá Sơn Chưởng" đẩy lui ba tên cao thủ. Tiếng vỡ xương và tiếng thân người đập vào vách đá vang lên trong đêm vắng.',
  'Nội lực vận hành theo Nhâm Đốc nhị mạch, chân khí ấm áp lan tỏa khắp kinh mạch. Năm năm khổ luyện cuối cùng đã có thành quả.',
  'Thiên Nhai Kiếm Pháp — pháp môn vô thượng của kiếm thánh ngàn năm trước. Giờ đây, nó được hồi sinh trong tay một thiếu niên vô danh.',
  'Đỉnh Hoa Sơn, gió lạnh như dao. Hai thanh kiếm chạm nhau phát ra âm thanh trong trẻo, vang vọng khắp sơn cốc.',
  'Anh nhớ lời sư phụ dặn dò: "Kiếm đạo không phải là giết chóc, mà là sự thấu hiểu về sinh tử."',
]

const HORROR_PARAGRAPHS = [
  'Ánh đèn nhấp nháy ba lần rồi tắt hẳn. Trong bóng tối dày đặc, tiếng thở dài cất lên ngay sau lưng — nhưng không ai ở đó.',
  'Cô nhìn vào gương và thấy bóng mình cử động chậm hơn nửa giây. Khi cô giơ tay, bóng trong gương giữ nguyên tư thế cũ thêm một khoảnh khắc rùng rợn.',
  'Tiếng bước chân trên trần nhà lại vang lên. Một bước. Hai bước. Dừng lại ngay trên đầu giường. Rồi tiếng cào cấu nhẹ nhàng, đều đặn, không ngừng.',
  '"Mày thấy không?" thằng bé thì thầm, mắt dán vào góc tối của căn phòng. "Nó đứng đó cả đêm rồi. Mày không thấy nó nhìn mình sao?"',
  'Bức ảnh gia đình chụp năm ngoái — anh đếm đi đếm lại, vẫn là bảy người. Nhưng gia đình anh chỉ có sáu người.',
  'Cánh cửa căn phòng 304 luôn bị khóa từ bên trong. Nhưng mỗi sáng khi nhân viên dọn phòng đi qua, họ đều nghe thấy tiếng hát ru vọng ra.',
  'Điện thoại đổ chuông lúc 3 giờ sáng. Số gọi đến là số của chính anh. Và giọng người bên kia — giống hệt anh — chỉ nói một câu: "Đừng mở cửa."',
]

const ROMANCE_PARAGRAPHS = [
  'Ánh mắt anh dừng lại trên khuôn mặt cô lâu hơn cần thiết. Cô cảm nhận được điều đó, nhưng cố tình nhìn đi chỗ khác, má ửng hồng.',
  '"Tại sao anh lại làm vậy?" cô hỏi, giọng run nhẹ. Anh không trả lời, chỉ nhích lại gần hơn, đôi mắt sâu thẳm không rời khỏi mặt cô.',
  'Khoảnh khắc tay anh chạm vào vai cô, cả thế giới dường như lặng xuống. Chỉ còn lại hơi ấm từ ngón tay anh và tiếng tim cô đập dồn dập.',
  'Họ đứng dưới mưa, không ai nhúc nhích. Cô biết mình nên đi, biết đây là sai, nhưng đôi chân cứng đờ và trái tim lại đang la hét điều ngược lại.',
  '"Anh không yêu cô," anh nói, giọng khàn khàn. Rồi nhìn thẳng vào mắt cô: "Anh chưa bao giờ ngừng yêu cô từ ngày đầu gặp nhau."',
  'Buổi sáng, cô tỉnh dậy trong căn phòng quen thuộc nhưng mọi thứ đều khác. Ánh nắng cũng khác, không khí cũng khác — hay chính cô đang khác?',
  'Anh để lại một tách cà phê trước cửa phòng cô mỗi sáng, không lời giải thích. Cô mất ba tuần để nhận ra — đó là cách anh nói yêu.',
]

function getGenreParagraphs(genres: string[]): string[] {
  if (genres.includes('horror')) return HORROR_PARAGRAPHS
  if (genres.includes('martial_arts') && !genres.includes('fantasy')) return MARTIAL_PARAGRAPHS
  if (genres.includes('fantasy')) return FANTASY_PARAGRAPHS
  if (genres.includes('romance') || genres.includes('adult')) return ROMANCE_PARAGRAPHS
  return FANTASY_PARAGRAPHS
}

function generateContent(story: StorySeed, chapterNum: number, pageNum: number): string {
  const paras = getGenreParagraphs(story.genres)
  const pick = (offset: number) => paras[(chapterNum * 3 + pageNum + offset) % paras.length]

  const chapterTitles: Record<string, string[]> = {
    fantasy: ['Khởi Nguyên', 'Cơ Duyên', 'Đột Phá', 'Thử Thách', 'Bí Mật', 'Đại Chiến', 'Giác Ngộ', 'Thiên Kiếp', 'Vượt Kiếp', 'Đăng Đỉnh'],
    martial_arts: ['Hạ Sơn', 'Giang Hồ', 'Kỳ Ngộ', 'Ân Oán', 'Tỉ Thí', 'Phong Ba', 'Ẩn Bí', 'Quyết Đấu', 'Chân Lý', 'Quy Ẩn'],
    horror: ['Bắt Đầu', 'Dấu Hiệu', 'Sợ Hãi', 'Bóng Tối', 'Tiết Lộ', 'Thật Sự', 'Kết Cục'],
    romance: ['Gặp Gỡ', 'Hiểu Lầm', 'Gần Hơn', 'Xúc Động', 'Tâm Tư', 'Thú Nhận', 'Hạnh Phúc'],
  }

  const genre = story.genres[0] as keyof typeof chapterTitles
  const titles = chapterTitles[genre] ?? chapterTitles.fantasy
  const chapterTitle = titles[(chapterNum - 1) % titles.length]

  return `${story.title} — Chương ${chapterNum}: ${chapterTitle} (Trang ${pageNum})

${pick(0)}

${pick(1)}

Nhân vật dừng lại, hít một hơi dài. Phía trước là con đường chưa biết kết quả, phía sau là những gì đã qua không thể thay đổi. Lựa chọn duy nhất là tiếp tục.

${pick(2)}

Thời gian trôi qua trong im lặng. Mỗi khoảnh khắc đều mang nặng ý nghĩa riêng, như những trang sách mà số phận đang lật qua từng tờ không ngừng nghỉ.

${pick(3)}

${pageNum < story.pagesPerChapter ? `(Tiếp theo ở trang ${pageNum + 1}...)` : `(Hết chương ${chapterNum})`}`.trim()
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('Seeding database...')

  await prisma.readingProgress.deleteMany()
  await prisma.page.deleteMany()
  await prisma.chapter.deleteMany()
  await prisma.storyGenre.deleteMany()
  await prisma.story.deleteMany()
  await prisma.user.deleteMany()

  // Users
  const adminPw = await bcrypt.hash('admin123', 12)
  const admin = await prisma.user.create({
    data: {
      email: 'admin@truyen.dev',
      password: adminPw,
      name: 'Admin',
      role: Role.ADMIN,
      dob: new Date('1990-01-01'),
      isAgeVerified: true,
    },
  })

  const userPw = await bcrypt.hash('user123', 12)
  const user = await prisma.user.create({
    data: {
      email: 'user@truyen.dev',
      password: userPw,
      name: 'Người Đọc',
      dob: new Date('1995-06-15'),
      isAgeVerified: true,
    },
  })

  // Stories
  let totalChapters = 0
  let totalPages = 0
  const createdStories: { id: string; slug: string; firstChapterId: string }[] = []

  for (const s of STORIES) {
    const story = await prisma.story.create({
      data: {
        title: s.title,
        slug: s.slug,
        description: s.description,
        status: s.status,
        isAdult: s.isAdult,
        genres: { create: s.genres.map((g) => ({ genre: g })) },
      },
    })

    let firstChapterId = ''
    for (let chNum = 1; chNum <= s.chapters; chNum++) {
      const ch = await prisma.chapter.create({
        data: {
          storyId: story.id,
          number: chNum,
          title: null, // generated inline in content
        },
      })
      if (chNum === 1) firstChapterId = ch.id

      for (let pgNum = 1; pgNum <= s.pagesPerChapter; pgNum++) {
        await prisma.page.create({
          data: {
            chapterId: ch.id,
            number: pgNum,
            content: generateContent(s, chNum, pgNum),
          },
        })
        totalPages++
      }
      totalChapters++
    }

    createdStories.push({ id: story.id, slug: s.slug, firstChapterId })
  }

  // Reading progress for the regular user on first 3 stories
  for (let i = 0; i < Math.min(3, createdStories.length); i++) {
    const { id: storyId, firstChapterId } = createdStories[i]
    await prisma.readingProgress.create({
      data: {
        userId: user.id,
        storyId,
        chapterId: firstChapterId,
        pageNumber: 1,
      },
    })
  }

  console.log(`Seed completed:
  users:    2 (admin@truyen.dev / admin123, user@truyen.dev / user123)
  stories:  ${STORIES.length}
  chapters: ${totalChapters}
  pages:    ${totalPages}`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
