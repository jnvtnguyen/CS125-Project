'''
For tokenization of song names for search, 
We will simply use nltk's tokenizer to separate the text
Then use nltk's porter stemmer to further simplify the tokens
'''


from nltk.stem import PorterStemmer
import nltk

nltk.download('punkt')
nltk.download('punkt_tab')

ps = PorterStemmer()

#tokenize the text and return a list of strings (tokens)
def tokenize_text(text):
    text = text.lower()

    tokens = list()

    #tokenize using nltk's tokenizer
    words = nltk.word_tokenize(text)
    for word in words:
        if word.isalnum() and not word.startswith("'") and not word.isdigit() and word.isascii() and not word.startswith("0x"):
            tokens.append(ps.stem(word))
    return tokens