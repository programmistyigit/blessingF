import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
// Redux hook va action-larni import qilamiz
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { requestSmsCode, verifySmsCode, setPhoneNumber as setReduxPhoneNumber } from '@/redux/slices/authSlice';
// To'g'ridan-to'g'ri API va auth funksiyalarni ishlatsak ham bo'ladi (test uchun)
import { setToken, setUser, isAuthenticated } from '@/lib/auth';
import { baseHost } from '@/lib/host';
import { requestLoginCode, verifyLoginCode } from '@/lib/api';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Telefon raqam kiritish uchun schema
const phoneFormSchema = z.object({
  phoneNumber: z.string().regex(/^\+?\d{10,15}$/, {
    message: "Telefon raqam to'g'ri formatda bo'lishi kerak. Masalan: +998901234567",
  }),
});

// SMS kod kiritish uchun schema
const smsCodeFormSchema = z.object({
  code: z.string().length(6, {
    message: "SMS kod 6 ta raqamdan iborat bo'lishi kerak",
  }),
});

type PhoneFormValues = z.infer<typeof phoneFormSchema>;
type SmsCodeFormValues = z.infer<typeof smsCodeFormSchema>;

// Login ikki bosqichli autentifikatsiya bilan
const Login: React.FC = () => {
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const dispatch = useAppDispatch();
  
  // Redux state-larni olish
  const authState = useAppSelector((state: any) => state.auth);
  const { loading, error: reduxError, phoneNumber: reduxPhoneNumber } = authState || { loading: false, error: null, phoneNumber: null };
  
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  // Lokal state ham saqlaymiz (test rejim uchun)
  const [phoneNumber, setLocalPhoneNumber] = useState<string | null>(null);
  
  // Agar foydalanuvchi allaqachon login qilgan bo'lsa, asosiy sahifaga yo'naltirish
  useEffect(() => {
    // Redux auth state-ni va localStorage'dagi tokenni tekshirish
    const isLoggedIn = authState.isAuthenticated || isAuthenticated();
    
    if (isLoggedIn) {
      console.log('Login: User is already authenticated, redirecting to dashboard');
      setLocation('/');
    }
  }, [setLocation, authState.isAuthenticated]);

  // Telefon raqam kiritish uchun forma
  const phoneForm = useForm<PhoneFormValues>({
    resolver: zodResolver(phoneFormSchema),
    defaultValues: {
      phoneNumber: phoneNumber || '',
    },
  });

  // SMS kod kiritish uchun forma
  const codeForm = useForm<SmsCodeFormValues>({
    resolver: zodResolver(smsCodeFormSchema),
    defaultValues: {
      code: '',
    },
  });

  // Telefon raqam yuborish
  const submitPhoneNumber = async (data: PhoneFormValues) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Telefon raqamni xalqaro formatga o'tkazish
      let formattedPhone = data.phoneNumber.trim();
      if (!formattedPhone.startsWith('+')) {
        formattedPhone = '+' + formattedPhone;
      }
      
      console.log('Login: Requesting SMS code for phone:', formattedPhone);
      
      // State-da telefon raqamni saqlash
      setLocalPhoneNumber(formattedPhone);
      // Redux state-da ham saqlash
      dispatch(setReduxPhoneNumber(formattedPhone));
      
      // SessionStorage-da ham saqlash
      sessionStorage.setItem('loginPhoneNumber', formattedPhone);
      
      // Test ishlash uchun
      const testPhoneNumber = "+998901234567";
      
      // Agar test raqam bo'lsa, sinov holatida to'g'ridan-to'g'ri ikkinchi bosqichga o'tamiz
      if (formattedPhone === testPhoneNumber) {
        toast({
          title: "Test telefon raqami bilan kirish",
          description: "Test rejimida ishlayapti"
        });
        console.log('Login: Using test phone number, skipping API call');
        setStep('code');
        return;
      }
      
      // Redux action orqali SMS kod so'rash
      try {
        console.log('Login: Calling Redux requestSmsCode action...');
        await dispatch(requestSmsCode(formattedPhone) as any);
        
        // Muvaffaqiyatli bo'lsa, keyingi bosqichga o'tamiz
        setStep('code');
        toast({
          title: "SMS kod yuborildi",
          description: `${formattedPhone} raqamiga SMS kod yuborildi`
        });
      } catch (apiError) {
        console.error('Login: API call error:', apiError);
        setError('Server bilan bog\'lanishda xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.');
        toast({
          variant: "destructive",
          title: "Xatolik",
          description: "Server bilan bog'lanishda muammo yuz berdi"
        });
      }
    } catch (err) {
      console.error('Login: Error in submitPhoneNumber:', err);
      setError('SMS kod so\'rov qilishda xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.');
    } finally {
      setIsLoading(false);
    }
  };

  // SMS kod tekshirish
  const submitSmsCode = async (data: SmsCodeFormValues) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // SessionStorage'dan telefon raqamni olish
      const savedPhoneNumber = sessionStorage.getItem('loginPhoneNumber');
      
      // Agar state-da telefon raqam yo'q bo'lsa, sessionstorage-dan olamiz
      let phoneToUse = phoneNumber;
      if (!phoneToUse) {
        console.log('Login: Phone number not found in state, checking sessionStorage');
        phoneToUse = savedPhoneNumber;
        
        // Agar sessionstorage-da ham yo'q bo'lsa, xatolik
        if (!phoneToUse) {
          console.error('Login: Phone number not found in state or session storage');
          setError('Telefon raqam topilmadi. Iltimos, qaytadan urinib ko\'ring.');
          setStep('phone');
          return;
        }
        
        // Agar sessionstorage-dan olingan bo'lsa, state-ga ham o'rnatamiz
        console.log('Login: Using phone number from session storage:', phoneToUse);
        setLocalPhoneNumber(phoneToUse);
        dispatch(setReduxPhoneNumber(phoneToUse));
      }
      
      console.log('Login: Verifying SMS code:', data.code, 'for phone:', phoneToUse);
      
      // Test telefon raqami uchun maxsus holatni ko'rib chiqamiz
      const testPhoneNumber = "+998901234567";
      const testCode = "123456";
      
      // Test telefon raqami va kodi uchun
      if (phoneToUse === testPhoneNumber && data.code === testCode) {
        console.log('Login: Using test credentials, skipping API call');
        
        // Sinov natijalarni qaytaramiz
        const testUser = {
          id: "test123",
          name: "Test Foydalanuvchi",
          phoneNumber: testPhoneNumber,
          role: "boss",
          section: {
            id: "section1",
            name: "Asosiy bo'lim"
          }
        };
        
        // Userga saqlash
        setUser(testUser);
        
        // Sinov tokeni saqlash
        setToken("test-token-123456789");
        
        toast({
          title: "Test rejimida kirish",
          description: "Sinov foydalanuvchi hisobi bilan tizimga kirdingiz"
        });
        
        // Asosiy sahifaga yo'naltirish
        setLocation('/');
        return;
      }
      
      // Redux action orqali SMS kodni tekshirish
      try {
        console.log('Login: Calling Redux verifySmsCode action...');
        
        // Redux action orqali SMS kodni tekshirish
        const resultAction = await dispatch(verifySmsCode({ 
          phoneNumber: phoneToUse, 
          code: data.code 
        }) as any);
        
        console.log('Login: Redux verifySmsCode result:', resultAction);
        
        // Muvaffaqiyatli bo'lsa
        if (verifySmsCode.fulfilled.match(resultAction)) {
          const userData = resultAction.payload.user;
          
          // Muvaffaqiyatli xabar
          toast({
            title: "Tizimga kirish muvaffaqiyatli",
            description: "Xush kelibsiz, " + (userData?.name || '')
          });
          
          // Asosiy sahifaga yo'naltirish
          setLocation('/');
          return;
        } 
        
        // Redux orqali tekшириш муваффақиятли бўлмаса, API билан синаб кўрамиз
        console.log('Login: Redux auth failed, trying direct API call...');
        const response = await verifyLoginCode(phoneToUse, data.code);
        console.log('Login: verifyLoginCode API response:', response);
        
        // Serverdan kelgan javobni tekshiramiz
        if (response && response.success) {
          console.log('Login: Success response structure check:', response);
          
          let userData = null;
          let tokenData = null;
          
          // Yangi API response strukturasi
          if (response.data && response.data.user && response.data.token) {
            userData = response.data.user;
            tokenData = response.data.token;
          } 
          // Eski API varianti
          else if (response.user && response.token) {
            userData = response.user;
            tokenData = response.token;
          }
          
          // Agar ma'lumotlar topilgan bo'lsa
          if (userData && tokenData) {
            // Foydalanuvchi ma'lumotlarini saqlash
            setUser(userData);
            
            // Tokenni saqlash
            setToken(tokenData);
            
            // Muvaffaqiyatli xabar
            toast({
              title: "Tizimga kirish muvaffaqiyatli",
              description: "Xush kelibsiz, " + userData.name
            });
            
            // Asosiy sahifaga yo'naltirish
            setLocation('/');
            return;
          }
        }
        
        // Agar bu yerga qadar chiqilmagan bo'lsa, xatolik bor
        console.log('Login: Verification failed - Invalid response structure', response);
        setError('Javob formati to\'g\'ri emas. Ma\'muriyatga murojaat qiling.');
        toast({
          variant: "destructive",
          title: "Xatolik",
          description: "Server javobini o'qishda muammo yuzaga keldi"
        });
      } catch (apiError) {
        console.error('Login: API error during verification:', apiError);
        setError('Server bilan bog\'lanishda xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.');
        toast({
          variant: "destructive",
          title: "Xatolik",
          description: "Server bilan bog'lanishda muammo yuz berdi"
        });
      }
    } catch (err) {
      console.error('Login: Error in submitSmsCode:', err);
      setError('SMS kod tekshirishda xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.');
    } finally {
      setIsLoading(false);
    }
  };

  // Orqaga qaytish
  const goBack = () => {
    setStep('phone');
    setError(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-100 px-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center text-white text-2xl font-bold">
                FM
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-center">Ferma Boshqaruv Tizimi</CardTitle>
            <CardDescription className="text-center">
              Bo'lim boshlig'i sifatida tizimga kiring
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Xatolik</AlertTitle>
                <AlertDescription>
                  {error}
                </AlertDescription>
              </Alert>
            )}
            
            {step === 'phone' ? (
              // Birinchi bosqich - Telefon raqam kiritish
              <Form {...phoneForm}>
                <form onSubmit={phoneForm.handleSubmit(submitPhoneNumber)} className="space-y-4">
                  <FormField
                    control={phoneForm.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefon raqam</FormLabel>
                        <FormControl>
                          <Input placeholder="+998901234567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-primary" 
                    disabled={isLoading}
                  >
                    {isLoading ? 'SMS kod yuborilmoqda...' : 'SMS kod olish'}
                  </Button>
                </form>
              </Form>
            ) : (
              // Ikkinchi bosqich - SMS kod kiritish
              <Form {...codeForm}>
                <form onSubmit={codeForm.handleSubmit(submitSmsCode)} className="space-y-4">
                  <div className="text-center mb-4">
                    <p className="text-neutral-600">
                      <span className="font-medium">{phoneNumber}</span> raqamiga SMS kod yuborildi
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      SMS kod terish uchun kutilmoqda
                    </p>
                  </div>
                  
                  <FormField
                    control={codeForm.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SMS kod</FormLabel>
                        <FormControl>
                          <Input placeholder="123456" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex gap-3">
                    <Button 
                      type="button" 
                      variant="outline"
                      className="flex-1" 
                      onClick={goBack}
                      disabled={isLoading}
                    >
                      Orqaga
                    </Button>
                    
                    <Button 
                      type="submit" 
                      className="flex-1 bg-primary" 
                      disabled={isLoading}
                    >
                      {isLoading ? 'Tekshirilmoqda...' : 'Kirish'}
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-neutral-500">
              &copy; {new Date().getFullYear()} Ferma Boshqaruv Tizimi
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Login;
