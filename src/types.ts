export type AuthContextType = {
  user: any;
  loading: boolean;
};

export interface Props {
  username: string;
  avatar: string;
  message: string;
  time: string;
  onPress: () => void;
}
