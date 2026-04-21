export default function Footer() {
  return (
    <footer className="bg-gray-900">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="space-y-8">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center">
                <img src="/bot-logo.png" alt="Logo" className="h-full w-full" />
              </div>
              <span className="ml-3 text-2xl font-bold text-white">
                AI HRM
              </span>
            </div>
            <p className="text-sm leading-6 text-gray-300">
              Giải pháp chatbot AI hàng đầu cho doanh nghiệp Việt Nam. Tự động
              hóa dịch vụ khách hàng, tăng hiệu quả kinh doanh.
            </p>
          </div>
          <div className="mt-16 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <ul role="list" className="mt-6 space-y-4">
                  <li>
                    <a
                      href="#features"
                      className="text-sm leading-6 text-gray-300 hover:text-white transition-colors"
                    >
                      Tính năng
                    </a>
                  </li>
                  <li>
                    <a
                      href="#demo"
                      className="text-sm leading-6 text-gray-300 hover:text-white transition-colors"
                    >
                      Demo
                    </a>
                  </li>
                  <li>
                    <a
                      href="/login"
                      className="text-sm leading-6 text-gray-300 hover:text-white transition-colors"
                    >
                      Đăng nhập
                    </a>
                  </li>
                </ul>
              </div>
              <div className="mt-10 md:mt-0">
                <h3 className="text-sm font-semibold leading-6 text-white">
                  Hỗ trợ
                </h3>
                <ul role="list" className="mt-6 space-y-4">
                  <li>
                    <a
                      href="/terms-of-service"
                      className="text-sm leading-6 text-gray-300 hover:text-white transition-colors"
                    >
                      Điều khoản sử dụng
                    </a>
                  </li>
                  <li>
                    <a
                      href="/privacy-policy"
                      className="text-sm leading-6 text-gray-300 hover:text-white transition-colors"
                    >
                      Chính sách quyền riêng tư
                    </a>
                  </li>
                  <li>
                    <a
                      href="#contact"
                      className="text-sm leading-6 text-gray-300 hover:text-white transition-colors"
                    >
                      Liên hệ
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-16 border-t border-white/10 pt-8 sm:mt-20 lg:mt-24">
          <p className="text-xs leading-5 text-gray-400 text-center">
            &copy; 2024 AI HRM. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
