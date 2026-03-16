let isInsideChat = false;

export const setChatScreenActive = (value: boolean) => {
  isInsideChat = value;
};

export const getChatScreenActive = () => {
  return isInsideChat;
};
