import React, { createContext, useContext, useState, useEffect } from "react";
import {
  getToken,
  getUser,
  setToken,
  setUser,
  removeToken,
  removeUser,
  isTokenExpired,
} from "@/lib/auth";
import { requestLoginCode, verifyLoginCode } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  name: string;
  phoneNumber: string;
  role: string;
  section: {
    id: string;
    name: string;
  };
  position?: {
    id: string;
    name: string;
  };
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  requestSmsCode: (phoneNumber: string) => Promise<boolean>;
  verifySmsCode: (phoneNumber: string, code: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
  phoneNumber: string | null;
  setPhoneNumber: (phone: string | null) => void;
}

// Bayroqlar yordamida kontext ishlalishini aniqlaymiz
export const AuthContextNotInitializedError = new Error(
  'Auth kontekstidan foydalanish uchun, uning provideriga Component o`rab olish kerak.'
);

// null boshlang'ich qiymat bilan yaratamiz, tashqarida Providerdan tashqarida ishlatishni oldini olish uchun
const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    // Bu xatolikni ekranga chiqmasligi uchun, xato chiqamiz
    console.error(AuthContextNotInitializedError);
    throw AuthContextNotInitializedError;
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check if the user is already authenticated
    const token = getToken();
    const userData = getUser();

    if (token && userData) {
      // Check if token is expired
      if (isTokenExpired(token)) {
        // Token is expired, log the user out
        removeToken();
        removeUser();
        setUserState(null);
      } else {
        // Token is valid, set the user
        setUserState(userData);
      }
    }

    setLoading(false);
  }, []);

  // Birinchi bosqich - SMS kod so'rash
  const requestSmsCode = async (phone: string): Promise<boolean> => {
    console.log("AuthContext: Requesting SMS code for phone:", phone);
    setLoading(true);

    try {
      // API bilan bo'glangan holatni kuzatib borish uchun kengaytirilgan console.log
      console.log(
        "AuthContext: Preparing to call API requestLoginCode with phone:",
        phone,
      );
      console.log(
        "AuthContext: API endpoint: https://fd2e9e6c-b15b-47eb-907f-fa3da2702e02-00-1xz9qkza1gkp3.spock.replit.dev/api/auth/login",
      );

      // API chaqirig'i oldin qo'shimcha console.log
      const response = await requestLoginCode(phone);
      console.log("AuthContext: Response type:", typeof response);
      console.log(
        "AuthContext: SMS code request API response received:",
        response,
      );

      // Agar javob null bo'lsa
      if (!response) {
        console.error("AuthContext: SMS code request - no response returned");
        toast({
          title: "Xatolik",
          description: "Server bilan ulanishda xatolik yuz berdi",
          variant: "destructive",
        });
        return false;
      }

      // Agar javob muvaffaqiyatli bo'lmasa
      if (!response.success) {
        console.error(
          "AuthContext: SMS code request failed, reason:",
          response.message,
        );
        toast({
          title: "Xatolik",
          description: response.message || "Telefon raqam topilmadi",
          variant: "destructive",
        });
        return false;
      }

      // SMS kod so'rovi muvaffaqiyatli
      console.log(
        "AuthContext: API call successful, updating phone state:",
        phone,
      );
      setPhoneNumber(phone);

      toast({
        title: "SMS kod yuborildi",
        description: "Test rejimida kod: 123456",
      });

      // Muvaffaqiyatli natija qaytishdan oldin holat o'zgarishini kuting
      await new Promise((resolve) => setTimeout(resolve, 100));

      console.log("AuthContext: Successfully completed SMS code request");
      return true;
    } catch (error) {
      console.error("AuthContext: SMS code request caught error:", error);

      toast({
        title: "Xatolik",
        description:
          "Kutilmagan xatolik yuz berdi. Iltimos, qayta urinib ko'ring.",
        variant: "destructive",
      });

      return false;
    } finally {
      console.log(
        "AuthContext: Finishing SMS code request, setting loading=false",
      );
      setLoading(false);
    }
  };

  // Ikkinchi bosqich - SMS kodni tekshirish va login
  const verifySmsCode = async (
    phone: string,
    code: string,
  ): Promise<boolean> => {
    try {
      setLoading(true);
      console.log("AuthContext: Verifying SMS code for phone:", phone);
      console.log(
        "AuthContext: SMS code verification endpoint: https://fd2e9e6c-b15b-47eb-907f-fa3da2702e02-00-1xz9qkza1gkp3.spock.replit.dev/api/auth/verify",
      );

      const response = await verifyLoginCode(phone, code);
      console.log("AuthContext: Response type:", typeof response);
      console.log("AuthContext: SMS code verification response:", response);

      if (!response) {
        console.error(
          "AuthContext: SMS code verification - no response returned",
        );
        toast({
          title: "Xatolik",
          description: "Server bilan ulanishda xatolik yuz berdi",
          variant: "destructive",
        });
        return false;
      }

      if (!response.success) {
        console.log(
          "AuthContext: SMS code verification failed, reason:",
          response.message,
        );
        toast({
          title: "Xatolik",
          description: response.message || "Noto'g'ri SMS kod",
          variant: "destructive",
        });
        return false;
      }

      // SMS kod tekshiruvi muvaffaqiyatli - yangi API formatiga ko'ra
      if (response.data && response.data.token && response.data.user) {
        console.log("AuthContext: Login successful, token received");

        // API hujjatlariga ko'ra data ichida user va token uchraydi
        const { token, user } = response.data;

        // Save the token and user data to local storage
        setToken(token);
        setUser(user);

        // Update state
        setUserState(user);

        toast({
          title: "Kirish muvaffaqiyatli",
          description: `Xush kelibsiz, ${user.name}!`,
        });

        return true;
      }

      // Eskiroq API format uchun tekshirish (transition davrida)
      if (response.token && response.user) {
        console.log("AuthContext: Login successful with legacy API format");

        // Save the token and user data to local storage
        setToken(response.token);
        setUser(response.user);

        // Update state
        setUserState(response.user);

        toast({
          title: "Kirish muvaffaqiyatli",
          description: `Xush kelibsiz, ${response.user.name}!`,
        });

        return true;
      }

      console.error("AuthContext: Login successful but token or user missing");
      toast({
        title: "Xatolik",
        description: "Autentifikatsiya ma'lumotlarida xatolik",
        variant: "destructive",
      });

      return false;
    } catch (error) {
      console.error("SMS code verification error:", error);

      toast({
        title: "Xatolik",
        description:
          "Kutilmagan xatolik yuz berdi. Iltimos, qayta urinib ko'ring.",
        variant: "destructive",
      });

      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    removeToken();
    removeUser();
    setUserState(null);

    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        requestSmsCode,
        verifySmsCode,
        logout,
        loading,
        phoneNumber,
        setPhoneNumber,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
